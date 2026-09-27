<?php

namespace App\Services;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoiceService
{
    /**
     * Returns the invoice PDF for an order as raw bytes. Cached on S3 once
     * generated (invoice content is immutable once an order exists) when S3 is
     * configured; falls back to generating fresh every time otherwise, since
     * AWS credentials aren't wired up until a later phase.
     */
    public static function getPdf(Order $order): string
    {
        $s3Available = (bool) config('filesystems.disks.s3.key');

        if ($s3Available && $order->invoice_pdf_path && Storage::disk('s3')->exists($order->invoice_pdf_path)) {
            return Storage::disk('s3')->get($order->invoice_pdf_path);
        }

        $order->loadMissing(['items', 'market', 'customer']);

        $pdf = Pdf::loadView('invoice.download', [
            'order' => $order,
            'appName' => 'Palengkey',
        ]);

        $binary = $pdf->output();

        if ($s3Available) {
            $path = 'invoices/'.$order->order_number.'.pdf';
            Storage::disk('s3')->put($path, $binary);
            $order->update(['invoice_pdf_path' => $path]);
        }

        return $binary;
    }
}
