<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;

class CmsContent extends Model
{
    use HasTranslations;

    protected array $translatable = ['value'];

    protected $fillable = ['key', 'group', 'label', 'type', 'value', 'sort_order'];

    protected function casts(): array
    {
        return ['value' => 'array', 'sort_order' => 'integer'];
    }
}
