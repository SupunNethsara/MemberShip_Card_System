<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessCategory extends Model
{
    use HasTranslations;

    protected array $translatable = ['name'];

    protected $fillable = ['slug', 'name', 'icon', 'sort_order'];

    protected function casts(): array
    {
        return ['name' => 'array', 'sort_order' => 'integer'];
    }

    public function partners(): HasMany
    {
        return $this->hasMany(Partner::class);
    }
}
