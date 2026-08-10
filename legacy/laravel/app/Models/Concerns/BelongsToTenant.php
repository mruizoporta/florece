<?php

namespace App\Models\Concerns;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($id = Tenant::current()?->id) {
                $builder->where($builder->getModel()->getTable().'.tenant_id', $id);
            }
        });

        static::creating(function (Model $model) {
            if ($model->getAttribute('tenant_id') === null && ($tenant = Tenant::current())) {
                $model->setAttribute('tenant_id', $tenant->id);
            }
        });
    }
}
