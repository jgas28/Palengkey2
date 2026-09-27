<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    public static function log($action, $model, $modelId = null, $old = null, $new = null): void
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model' => is_object($model) ? class_basename($model) : $model,
            'model_id' => $modelId,
            'old_values' => $old,
            'new_values' => $new,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    public static function custom($action, array $data = []): void
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model' => null,
            'model_id' => null,
            'old_values' => null,
            'new_values' => $data,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
