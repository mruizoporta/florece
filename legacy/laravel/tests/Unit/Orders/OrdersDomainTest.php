<?php

namespace Tests\Unit\Orders;

use App\Domain\Orders\Exceptions\InsufficientStockException;
use App\Domain\Orders\Exceptions\InvalidOrderQuantityException;
use App\Domain\Orders\OrderTotalsCalculator;
use PHPUnit\Framework\TestCase;

class OrdersDomainTest extends TestCase
{
    public function test_calculates_totals(): void
    {
        $calculator = new OrderTotalsCalculator();
        $totals = $calculator->calculate([
            ['quantity' => 2, 'unit_price' => 10.0, 'line_discount' => 1.0, 'line_tax' => 2.0],
            ['quantity' => 1, 'unit_price' => 5.0, 'line_discount' => 0.0, 'line_tax' => 0.5],
        ]);

        $this->assertSame(25.0, $totals['subtotal']);
        $this->assertSame(1.0, $totals['discount_total']);
        $this->assertSame(2.5, $totals['tax_total']);
        $this->assertSame(26.5, $totals['total']);
    }

    public function test_total_cannot_be_negative(): void
    {
        $this->expectException(\DomainException::class);

        (new OrderTotalsCalculator())->calculate([
            ['quantity' => 1, 'unit_price' => 5.0, 'line_discount' => 10.0, 'line_tax' => 0.0],
        ]);
    }

    public function test_invalid_quantity_exception_message(): void
    {
        $e = InvalidOrderQuantityException::forQuantity(0);
        $this->assertStringContainsString('inválida', $e->getMessage());
    }

    public function test_insufficient_stock_exception_message(): void
    {
        $e = InsufficientStockException::forProduct(2, 5, 1);
        $this->assertStringContainsString('#2', $e->getMessage());
    }
}

