<?php

namespace Tests\Unit\Catalog;

use App\Domain\Catalog\Category\Category as CategoryEntity;
use App\Domain\Catalog\Exceptions\DuplicateCategoryNameException;
use App\Domain\Catalog\Exceptions\DuplicateItemNameException;
use App\Domain\Catalog\Exceptions\InvalidItemPriceException;
use App\Domain\Catalog\Exceptions\InvalidProductStockException;
use App\Domain\Catalog\Exceptions\InvalidServiceDurationException;
use App\Domain\Catalog\Item\Item as ItemEntity;
use App\Domain\Catalog\Product\Product as ProductEntity;
use App\Domain\Catalog\Service\Service as ServiceEntity;
use PHPUnit\Framework\TestCase;

class CatalogDomainTest extends TestCase
{
    public function test_item_price_must_be_non_negative(): void
    {
        $this->expectException(InvalidItemPriceException::class);

        new ItemEntity(
            categoryId: 1,
            name: 'Corte',
            slug: 'corte',
            price: -1,
            description: 'desc',
            image: null,
            status: true,
        );
    }

    public function test_service_duration_must_be_positive(): void
    {
        $this->expectException(InvalidServiceDurationException::class);

        new ServiceEntity(durationTime: 0);
    }

    public function test_product_stock_must_be_non_negative(): void
    {
        $this->expectException(InvalidProductStockException::class);

        new ProductEntity(stock: -1);
    }

    public function test_duplicate_exceptions_have_message(): void
    {
        $e = DuplicateItemNameException::forName('A');
        $this->assertStringContainsString('A', $e->getMessage());

        $e2 = DuplicateCategoryNameException::forName('Cat');
        $this->assertStringContainsString('Cat', $e2->getMessage());
    }

    public function test_category_entity_requires_name_and_slug(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new CategoryEntity(name: '', slug: 'cat');
    }
}

