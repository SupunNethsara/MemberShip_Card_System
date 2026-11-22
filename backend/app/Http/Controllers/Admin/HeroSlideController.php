<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\HeroSlideRequest;
use App\Http\Resources\HeroSlideResource;
use App\Models\Concerns\HasTranslations;
use App\Models\HeroSlide;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

/** CMS › Hero slides. Routes are guarded by cms.view / cms.manage. */
class HeroSlideController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(): AnonymousResourceCollection
    {
        return HeroSlideResource::collection(HeroSlide::query()->orderBy('sort_order')->orderBy('id')->get());
    }

    public function store(HeroSlideRequest $request): HeroSlideResource
    {
        $slide = $this->save(new HeroSlide, $request);
        $this->audit->log('cms.hero.created', 'Created hero slide "'.$slide->translate('title', 'en').'"', $slide);

        return new HeroSlideResource($slide);
    }

    /** POST (not PUT) so multipart background uploads parse in PHP. */
    public function update(HeroSlideRequest $request, HeroSlide $heroSlide): HeroSlideResource
    {
        $slide = $this->save($heroSlide, $request);
        $this->audit->log('cms.hero.updated', 'Updated hero slide "'.$slide->translate('title', 'en').'"', $slide);

        return new HeroSlideResource($slide);
    }

    public function destroy(HeroSlide $heroSlide): JsonResponse
    {
        $this->audit->log('cms.hero.deleted', 'Deleted hero slide "'.$heroSlide->translate('title', 'en').'"', $heroSlide);
        if ($heroSlide->background_path) {
            Storage::disk('public')->delete($heroSlide->background_path);
        }
        $heroSlide->delete();

        return response()->json(['message' => 'Slide deleted']);
    }

    private function save(HeroSlide $slide, HeroSlideRequest $request): HeroSlide
    {
        $data = [];
        foreach (HeroSlide::TRANSLATABLE as $field) {
            if ($request->has($field) || ! $slide->exists) {
                $data[$field] = HasTranslations::normalizeTranslation($request->input($field, []));
            }
        }
        foreach (['cta_primary_url', 'cta_secondary_url', 'sort_order'] as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }
        if ($request->has('is_active')) {
            $data['is_active'] = $request->boolean('is_active');
        }

        $old = $slide->background_path;
        if ($file = $request->file('background')) {
            $data['background_path'] = $file->store('hero', 'public');
        } elseif ($request->boolean('remove_background')) {
            $data['background_path'] = null;
        }

        $slide->fill($data)->save();

        if (array_key_exists('background_path', $data) && $old && $old !== $slide->background_path) {
            Storage::disk('public')->delete($old);
        }

        return $slide->refresh();
    }
}
