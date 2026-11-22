<?php

namespace App\Repositories;

use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Data-access base: whitelisted search/sort, server-side pagination and CRUD.
 * Search columns may be JSON paths (e.g. "name->si") for localized fields.
 */
abstract class BaseRepository
{
    /** @var string[] */
    protected array $searchable = [];

    /** @var string[] request sort key => column */
    protected array $sortable = ['id' => 'id', 'created_at' => 'created_at'];

    protected string $defaultSort = 'created_at';

    protected string $defaultDirection = 'desc';

    protected array $with = [];

    /** @return class-string<Model> */
    abstract protected function model(): string;

    public function query(): Builder
    {
        return $this->model()::query()->with($this->with);
    }

    /**
     * @param  array{search?:string, sort?:string, direction?:string, per_page?:int}  $params
     */
    public function paginate(array $params = [], ?Closure $scope = null): LengthAwarePaginator
    {
        $query = $this->query();

        if ($scope) {
            $scope($query);
        }

        $this->applySearch($query, trim((string) ($params['search'] ?? '')));
        $this->applySort($query, $params['sort'] ?? null, $params['direction'] ?? null);

        $perPage = min(max((int) ($params['per_page'] ?? 15), 5), 100);

        return $query->paginate($perPage)->withQueryString();
    }

    protected function applySearch(Builder $query, string $term): void
    {
        if ($term === '' || ! $this->searchable) {
            return;
        }

        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';

        $query->where(function (Builder $w) use ($like) {
            foreach ($this->searchable as $column) {
                if (str_contains($column, '.') && ! str_contains($column, '->')) {
                    [$relation, $col] = explode('.', $column, 2);
                    $w->orWhereHas($relation, fn (Builder $r) => $r->where($col, 'like', $like));
                } else {
                    $w->orWhere($column, 'like', $like);
                }
            }
        });
    }

    protected function applySort(Builder $query, ?string $sort, ?string $direction): void
    {
        $column = $this->sortable[$sort] ?? $this->sortable[$this->defaultSort] ?? $this->defaultSort;
        $dir = in_array(strtolower((string) $direction), ['asc', 'desc'], true) ? strtolower($direction) : $this->defaultDirection;

        $query->orderBy($column, $dir);
        if ($column !== 'id') {
            $query->orderBy($query->getModel()->getTable().'.id', $dir);
        }
    }

    public function find(int $id): Model
    {
        return $this->query()->findOrFail($id);
    }

    public function create(array $data): Model
    {
        return $this->model()::query()->create($data);
    }

    public function update(Model $model, array $data): Model
    {
        $model->fill($data)->save();

        return $model->refresh();
    }

    public function delete(Model $model): void
    {
        $model->delete();
    }
}
