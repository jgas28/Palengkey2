<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            // Ordered list of step strings for the "How to Cook" guide.
            $table->json('steps')->nullable()->after('description');
            $table->text('tips')->nullable()->after('steps');
        });
    }

    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropColumn(['steps', 'tips']);
        });
    }
};
