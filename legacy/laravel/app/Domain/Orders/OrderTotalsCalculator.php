<?php

namespace App\Domain\Orders;

class OrderTotalsCalculator
{
    /**
     * @param  array<int, array{quantity:int,unit_price:float,line_discount?:float,line_tax?:float}>  $items
     * @return array{subtotal:float,discount_total:float,tax_total:float,total:float}
     */
    public function calculate(array $items, float $orderDiscount = 0.0): array
    {
        $subtotal = 0.0;
        $discountTotal = 0.0;
        $taxTotal = 0.0;

        foreach ($items as $item) {
            $qty = (int) $item['quantity'];
            $unitPrice = (float) $item['unit_price'];
            $lineDiscount = (float) ($item['line_discount'] ?? 0.0);
            $lineTax = (float) ($item['line_tax'] ?? 0.0);

            $lineSubtotal = $qty * $unitPrice;
            $subtotal += $lineSubtotal;
            $discountTotal += $lineDiscount;
            $taxTotal += $lineTax;
        }

        $discountTotal += max(0.0, $orderDiscount);
        $total = $subtotal - $discountTotal + $taxTotal;
        if ($total < 0) {
            throw new \DomainException('El total de la orden no puede ser negativo.');
        }

        return [
            'subtotal' => round($subtotal, 2),
            'discount_total' => round($discountTotal, 2),
            'tax_total' => round($taxTotal, 2),
            'total' => round($total, 2),
        ];
    }
}

