<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Out-of-stock items come back automatically each morning (Manila time).
Illuminate\Support\Facades\Schedule::command('items:restock')->dailyAt('00:05')->timezone('Asia/Manila');
