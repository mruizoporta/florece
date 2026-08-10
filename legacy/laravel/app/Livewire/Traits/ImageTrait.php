<?php

namespace App\Livewire\Traits;

use Illuminate\Support\Facades\Storage;

trait ImageTrait {

    public function verySmall($path, $image){
        return $this->resolveImagePath($path, '64', $image);
    }

    public function small($path, $image){
        return $this->resolveImagePath($path, '128', $image);
    }

    public function medium($path, $image){
        return $this->resolveImagePath($path, '300', $image);
    }

    public function large($path, $image){
        return $this->resolveImagePath($path, '512', $image);
    }

    public function veryLarge($path, $image){
        return $this->resolveImagePath($path, '800', $image);
    }

    public function extraLarge($path, $image){
        return $this->resolveImagePath($path, '1920', $image);
    }

    public function original($path, $image){
        return $this->resolveImagePath($path, 'original', $image);
    }

    /**
     * Returns a path suitable for asset(): storage/... or images/placeholders/...
     */
    protected function resolveImagePath(string $path, string $sizeDir, $image): string
    {
        $image = $image !== null ? trim((string) $image) : '';
        if ($image === '') {
            return $this->defaultPlaceholderForPath($path);
        }

        $memoKey = $path.'|'.$sizeDir.'|'.$image;
        static $resolved = [];
        if (isset($resolved[$memoKey])) {
            return $resolved[$memoKey];
        }

        $prefix = $this->storageDiskPrefixFromUrlPath($path);
        if ($prefix === null) {
            return $resolved[$memoKey] = rtrim($path, '/').'/'.$sizeDir.'/'.$image;
        }

        $disk = Storage::disk('public');
        foreach ($this->resolutionCandidates($prefix, $sizeDir, $image) as $relative) {
            if ($disk->exists($relative)) {
                return $resolved[$memoKey] = 'storage/'.$relative;
            }
        }

        return $resolved[$memoKey] = $this->defaultPlaceholderForPath($path);
    }

    /**
     * @return list<string> paths relative to storage/app/public (e.g. employees/64/foo.webp)
     */
    protected function resolutionCandidates(string $prefix, string $sizeDir, string $image): array
    {
        $candidates = [];
        if ($sizeDir === 'original') {
            $candidates[] = $prefix . 'original/' . $image;
            foreach (['1920', '800', '512', '300', '128', '64'] as $fallbackSize) {
                $candidates[] = $prefix . $fallbackSize . '/' . $image;
            }

            return $candidates;
        }

        $candidates[] = $prefix . $sizeDir . '/' . $image;
        $candidates[] = $prefix . 'original/' . $image;

        return $candidates;
    }

    protected function storageDiskPrefixFromUrlPath(string $path): ?string
    {
        if (! str_starts_with($path, 'storage/')) {
            return null;
        }
        $rest = rtrim(substr($path, strlen('storage/')), '/');

        return $rest === '' ? null : $rest . '/';
    }

    protected function defaultPlaceholderForPath(string $path): string
    {
        if (str_contains($path, 'employees')) {
            return 'images/placeholders/avatar.svg';
        }

        return 'images/placeholders/item.svg';
    }

}
