<?php

namespace App\Services;

use App\Models\Item;

/** Parses the CSV format produced by InventoryController::template(): Item, Price, Available, CutoffTime(HH:MM), Unit. */
class InventoryCsvParser
{
    public static function parse(string $filePath): array
    {
        $rows = array_map('str_getcsv', file($filePath));
        array_shift($rows);

        $valid = [];
        $errors = [];
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;

            if (count($row) < 2) {
                $errors[] = "Row {$line}: expected at least Item and Price/Available columns.";
                continue;
            }

            $originalName = trim($row[0]);
            $name = mb_strtolower($originalName);

            if ($originalName === '') {
                continue;
            }

            if (isset($seen[$name])) {
                $errors[] = "Row {$line}: duplicate item '{$originalName}'.";
                continue;
            }
            $seen[$name] = true;

            $item = Item::whereRaw('LOWER(name) = ?', [$name])->first();
            if (! $item) {
                $errors[] = "Row {$line}: item '{$originalName}' not found.";
                continue;
            }

            $priceRaw = isset($row[1]) ? trim($row[1]) : '';
            $availableRaw = isset($row[2]) ? strtoupper(trim($row[2])) : '';
            $cutoffTimeRaw = isset($row[3]) ? trim($row[3]) : '';
            $unitRaw = isset($row[4]) ? trim($row[4]) : '';

            if ($priceRaw === '' && $availableRaw === '') {
                continue;
            }

            if ($availableRaw === 'NO' || $availableRaw === 'NA' || strtoupper($priceRaw) === 'NA') {
                $valid[] = [
                    'item' => $item,
                    'price' => null,
                    'available' => false,
                    'cutoff_time' => self::normalizeCutoffTime($cutoffTimeRaw),
                    'unit' => $unitRaw,
                ];
                continue;
            }

            $price = self::normalizePrice($priceRaw);

            if ($price === null) {
                $errors[] = "Row {$line}: invalid price for '{$originalName}'. Use a number like 10.10, or set Available to NO.";
                continue;
            }

            if ($price <= 0) {
                $errors[] = "Row {$line}: price must be greater than 0.";
                continue;
            }

            if ($price > 50000) {
                $errors[] = "Row {$line}: price too large (possible mistake).";
                continue;
            }

            $valid[] = [
                'item' => $item,
                'price' => $price,
                'available' => true,
                'cutoff_time' => self::normalizeCutoffTime($cutoffTimeRaw),
                'unit' => $unitRaw,
            ];
        }

        return ['valid' => $valid, 'errors' => $errors];
    }

    public static function normalizeCutoffTime(?string $rawTime): ?string
    {
        if (! $rawTime) {
            return null;
        }

        if (preg_match('/^(\d{1,2}):?(\d{2})$/', trim($rawTime), $matches)) {
            $hour = (int) $matches[1];
            $minute = (int) $matches[2];

            if ($hour >= 0 && $hour <= 23 && $minute >= 0 && $minute <= 59) {
                return sprintf('%02d:%02d', $hour, $minute);
            }
        }

        return null;
    }

    public static function normalizePrice(?string $rawPrice): ?float
    {
        if ($rawPrice === null || trim($rawPrice) === '') {
            return null;
        }

        $price = preg_replace('/[^0-9.\-]/', '', trim($rawPrice));

        if ($price === '' || ! is_numeric($price)) {
            return null;
        }

        return (float) $price;
    }
}
