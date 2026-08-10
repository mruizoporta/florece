<?php

namespace App\Models;

use App\Services\DemoTenantService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Cashier\Billable;

class Tenant extends Model
{
    use Billable;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_TRIAL = 'trial';
    public const STATUS_PENDING_PAYMENT = 'pending_payment';
    public const STATUS_PAST_DUE = 'past_due';
    public const STATUS_CANCELED = 'canceled';
    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'name',
        'slug',
        'is_demo',
        'billing_region',
        'locale',
        'billing_email',
        'plan_id',
        'scheduled_plan_id',
        'subscription_status',
        'subscription_ends_at',
        'trial_ends_at',
        'past_due_since',
    ];

    protected $casts = [
        'is_demo' => 'boolean',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
        'past_due_since' => 'datetime',
    ];

    public function isDemo(): bool
    {
        if ($this->is_demo) {
            return true;
        }

        return strtolower((string) $this->slug) === strtolower(DemoTenantService::DEMO_SLUG);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function scheduledPlan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'scheduled_plan_id');
    }

    public function stripeName(): ?string
    {
        return $this->name;
    }

    public function stripeEmail(): ?string
    {
        return $this->billing_email;
    }

    protected static ?Tenant $current = null;

    public static function setCurrent(?self $tenant): void
    {
        self::$current = $tenant;
    }

    public static function current(): ?self
    {
        return self::$current;
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function hasActiveSubscription(): bool
    {
        if ($this->isDemo()) {
            return true;
        }

        if ($this->subscription_status === self::STATUS_PENDING_PAYMENT) {
            return false;
        }

        // Preferir columnas locales antes de Cashier (evita query a subscriptions).
        if ($this->subscription_status === self::STATUS_ACTIVE) {
            return true;
        }

        if ($this->subscription_status === self::STATUS_TRIAL
            && $this->trial_ends_at
            && $this->trial_ends_at->isFuture()) {
            return true;
        }

        return $this->subscribed('default');
    }
}
