<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasTranslations;

    protected array $translatable = ['question', 'answer'];

    protected $fillable = ['question', 'answer', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['question' => 'array', 'answer' => 'array', 'sort_order' => 'integer', 'is_active' => 'boolean'];
    }
}
