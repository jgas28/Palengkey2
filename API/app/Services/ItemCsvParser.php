<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Item;
use App\Models\Type;
use App\Models\Unit;

class ItemCsvParser
{
    public static function parse($file)
    {
        // Strip a UTF-8 BOM (Excel adds one) so the header row isn't mistaken for data.
        $lines = file($file, FILE_IGNORE_NEW_LINES);
        if ($lines && str_starts_with($lines[0], "ï»¿")) {
            $lines[0] = substr($lines[0], 3);
        }
        $rows = array_map('str_getcsv', $lines ?: []);
        array_shift($rows); // remove header

        $categories = Category::active()->get()->keyBy(fn($c) => mb_strtolower($c->name));
        $types = Type::active()->get()->keyBy(fn($t) => mb_strtolower($t->name));
        // Units match by name or short name ("Kilogram" or "kg").
        $units = Unit::active()->get();
        $units = $units->keyBy(fn($u) => mb_strtolower($u->name))
            ->union($units->filter(fn($u) => $u->short_name)->keyBy(fn($u) => mb_strtolower($u->short_name)));

        // existing (name + unit) combos already in the database, to reject duplicates on import
        $existingKeys = Item::withoutGlobalScopes()
            ->get(['name', 'unit_id'])
            ->map(fn($i) => mb_strtolower($i->name) . '|' . $i->unit_id)
            ->flip();

        $valid = [];
        $errors = [];
        $seen = [];

        foreach ($rows as $index => $row) {

            $line = $index + 2;

            if (count(array_filter($row, fn($v) => trim((string) $v) !== '')) === 0) {
                continue; // skip blank lines
            }

            if (count($row) < 5) {
                $errors[] = "Row {$line}: Invalid column format. Expected Name, Description, Category, Type, Unit, Status(YES/NO), CutoffTime(HH:MM), BulkMinKg, BulkDiscountPerKg.";
                continue;
            }

            $name = trim($row[0] ?? '');
            $description = trim($row[1] ?? '');
            $categoryRaw = trim($row[2] ?? '');
            $typeRaw = trim($row[3] ?? '');
            $unitRaw = trim($row[4] ?? '');
            $statusRaw = isset($row[5]) ? strtoupper(trim($row[5])) : 'YES';
            $cutoffRaw = trim($row[6] ?? '');

            if ($name === '') {
                $errors[] = "Row {$line}: Item name is required.";
                continue;
            }

            $category = $categories->get(mb_strtolower($categoryRaw));
            if (!$category) {
                $errors[] = "Row {$line}: Category '{$categoryRaw}' not found or inactive.";
                continue;
            }

            // Type is optional.
            $type = $typeRaw === '' ? null : $types->get(mb_strtolower($typeRaw));
            if ($typeRaw !== '' && !$type) {
                $errors[] = "Row {$line}: Type '{$typeRaw}' not found or inactive.";
                continue;
            }

            $unit = $units->get(mb_strtolower($unitRaw));
            if (!$unit) {
                $errors[] = "Row {$line}: Unit '{$unitRaw}' not found or inactive.";
                continue;
            }

            $key = mb_strtolower($name) . '|' . $unit->id;

            if (isset($seen[$key])) {
                $errors[] = "Row {$line}: Duplicate item '{$name}' ({$unit->name}) in file.";
                continue;
            }
            $seen[$key] = true;

            if (isset($existingKeys[$key])) {
                $errors[] = "Row {$line}: Item '{$name}' with unit '{$unit->name}' already exists. Skipped.";
                continue;
            }

            $status = !in_array($statusRaw, ['NO', '0', 'INACTIVE'], true);

            $valid[] = [
                'name' => $name,
                'description' => $description !== '' ? $description : null,
                'category_id' => $category->id,
                'type_id' => $type?->id,
                'unit_id' => $unit->id,
                'status' => $status,
                'cutoff_time' => self::normalizeCutoffTime($cutoffRaw),
                // Optional bulk overrides (blank = use the category's).
                'bulk_min_kg' => self::positiveNumber($row[7] ?? null),
                'bulk_discount_per_kg' => self::positiveNumber($row[8] ?? null, true),
            ];
        }

        return [
            'valid' => $valid,
            'errors' => $errors,
        ];
    }

    private static function positiveNumber($raw, bool $allowZero = false): ?float
    {
        $raw = trim((string) $raw);
        if ($raw === '' || ! is_numeric($raw)) {
            return null;
        }
        $value = (float) $raw;

        return $value > 0 || ($allowZero && $value == 0) ? $value : null;
    }

    public static function normalizeCutoffTime(?string $rawTime): ?string
    {
        if (!$rawTime || $rawTime === '') {
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
}
