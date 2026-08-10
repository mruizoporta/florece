<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\CreateOrderData;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Tenant;

class CreateOrderCommand
{
    public function handle(CreateOrderData $data): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        if ($data->customerId !== null) {
            Customer::query()->findOrFail($data->customerId);
        }

        if ($data->employeeId !== null) {
            Employee::query()->findOrFail($data->employeeId);
        }

        return Order::query()->create([
            'customer_id' => $data->customerId,
            'employee_id' => $data->employeeId,
            'name' => $data->name,
            'payment_status' => false,
            'status' => 'draft',
            'subtotal' => 0,
            'discount' => 0,
            'discount_total' => 0,
            'tax_total' => 0,
            'total' => 0,
        ])->load(['items', 'payments', 'customer', 'employee']);
    }
}

