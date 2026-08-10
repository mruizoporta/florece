<?php

namespace Tests\Feature\Catalog;

use App\Application\Catalog\Commands\ArchiveProductCommand;
use App\Application\Catalog\Commands\ArchiveServiceCommand;
use App\Application\Catalog\Commands\CreateCategoryCommand;
use App\Application\Catalog\Commands\CreateProductCommand;
use App\Application\Catalog\Commands\CreateServiceCommand;
use App\Application\Catalog\Commands\DeleteOrArchiveCategoryCommand;
use App\Application\Catalog\Commands\UpdateCategoryCommand;
use App\Application\Catalog\Commands\UpdateProductCommand;
use App\Application\Catalog\Commands\UpdateServiceCommand;
use App\Application\Catalog\Commands\UpdateStockCommand;
use App\Application\Catalog\Queries\ListPublicCatalogQuery;
use App\Application\Catalog\DTOs\ArchiveProductData;
use App\Application\Catalog\DTOs\ArchiveServiceData;
use App\Application\Catalog\DTOs\CreateCategoryData;
use App\Application\Catalog\DTOs\CreateProductData;
use App\Application\Catalog\DTOs\CreateServiceData;
use App\Application\Catalog\DTOs\DeleteOrArchiveCategoryData;
use App\Application\Catalog\DTOs\UpdateCategoryData;
use App\Application\Catalog\DTOs\UpdateProductData;
use App\Application\Catalog\DTOs\UpdateServiceData;
use App\Application\Catalog\DTOs\UpdateStockData;
use App\Domain\Catalog\Exceptions\DuplicateCategorySlugException;
use App\Domain\Catalog\Exceptions\DuplicateItemSlugException;
use App\Domain\Catalog\Exceptions\InvalidProductStockException;
use App\Domain\Catalog\Exceptions\CategoryHasItemsException;
use App\Models\Category;
use App\Models\Tenant;
use App\Models\Service;
use App\Models\Product;
use App\Models\Item;
use App\Models\Image;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CatalogApplicationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Forzamos conexión sqlite para evitar dependencias de PostgreSQL en el sandbox.
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);
        config(['database.connections.sqlite.prefix' => '']);
        config(['database.connections.sqlite.foreign_key_constraints' => false]);
        DB::purge('sqlite');
        DB::purge('pgsql');

        $this->createCatalogSchema();
    }

    private function createCatalogSchema(): void
    {
        Schema::connection('sqlite')->dropIfExists('images');
        Schema::connection('sqlite')->dropIfExists('products');
        Schema::connection('sqlite')->dropIfExists('services');
        Schema::connection('sqlite')->dropIfExists('items');
        Schema::connection('sqlite')->dropIfExists('categories');

        Schema::connection('sqlite')->create('categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('slug');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        Schema::connection('sqlite')->create('items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('category_id');
            $table->string('name');
            $table->string('slug');
            $table->text('description');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('image')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('services', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('item_id');
            $table->integer('duration_time')->default(30);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('item_id');
            $table->integer('stock')->default(0);
            $table->integer('stock_alert')->default(5);
            $table->text('long_description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('product_id');
            $table->string('image');
            $table->integer('order')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    private function setTenant(int $tenantId): void
    {
        $tenant = new Tenant();
        $tenant->forceFill(['id' => $tenantId]);
        Tenant::setCurrent($tenant);
    }

    public function test_create_service_uniqueness_is_per_tenant(): void
    {
        $createCategory = app(CreateCategoryCommand::class);

        $this->setTenant(1);
        $cat1 = $createCategory->handle(new CreateCategoryData(name: 'Cat 1', slug: 'cat-1'));

        $this->setTenant(2);
        $cat2 = $createCategory->handle(new CreateCategoryData(name: 'Cat 2', slug: 'cat-2'));

        $createService = app(CreateServiceCommand::class);

        $this->setTenant(1);
        $service1 = $createService->handle(new CreateServiceData(
            categoryId: (int) $cat1->id,
            name: 'Corte',
            slug: 'corte',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $this->setTenant(2);
        $service2 = $createService->handle(new CreateServiceData(
            categoryId: (int) $cat2->id,
            name: 'Corte',
            slug: 'corte',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $this->assertNotSame($service1->item->id, $service2->item->id);

        $this->expectException(DuplicateItemSlugException::class);

        $this->setTenant(1);
        $createService->handle(new CreateServiceData(
            categoryId: (int) $cat1->id,
            name: 'Corte',
            slug: 'corte',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));
    }

    public function test_update_service_uniqueness_is_enforced_within_tenant(): void
    {
        $this->setTenant(1);

        $category = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'Cat', slug: 'cat')
        );

        $createService = app(CreateServiceCommand::class);
        $updateService = app(UpdateServiceCommand::class);

        $serviceA = $createService->handle(new CreateServiceData(
            categoryId: (int) $category->id,
            name: 'A',
            slug: 'a',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $serviceB = $createService->handle(new CreateServiceData(
            categoryId: (int) $category->id,
            name: 'B',
            slug: 'b',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $this->expectException(DuplicateItemSlugException::class);

        $updateService->handle(new UpdateServiceData(
            serviceId: (int) $serviceA->id,
            categoryId: (int) $category->id,
            name: 'A',
            slug: 'b',
            price: 12,
            description: 'desc2',
            image: null,
            status: true,
            durationTime: 35,
        ));
    }

    public function test_update_stock_enforces_non_negative_stock(): void
    {
        $this->setTenant(1);

        $category = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'Cat', slug: 'cat')
        );

        $product = app(CreateProductCommand::class)->handle(new CreateProductData(
            categoryId: (int) $category->id,
            name: 'Prod',
            slug: 'prod',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 5,
            stockAlert: 2,
            longDescription: null,
        ));

        $updated = app(UpdateStockCommand::class)->handle(new UpdateStockData(
            productId: (int) $product->id,
            stock: 10,
            stockAlert: 4,
        ));

        $this->assertSame(10, $updated->stock);

        $this->expectException(InvalidProductStockException::class);

        app(UpdateStockCommand::class)->handle(new UpdateStockData(
            productId: (int) $product->id,
            stock: -1,
            stockAlert: 4,
        ));
    }

    public function test_update_category_slug_uniqueness_is_per_tenant(): void
    {
        $this->setTenant(1);

        $categoryA = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'A', slug: 'a')
        );

        $categoryB = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'B', slug: 'b')
        );

        $this->expectException(DuplicateCategorySlugException::class);

        app(UpdateCategoryCommand::class)->handle(new UpdateCategoryData(
            categoryId: (int) $categoryB->id,
            name: 'B2',
            slug: 'a',
        ));
    }

    public function test_create_product_uniqueness_is_per_tenant(): void
    {
        $createCategory = app(CreateCategoryCommand::class);
        $createProduct = app(CreateProductCommand::class);

        $this->setTenant(1);
        $cat1 = $createCategory->handle(new CreateCategoryData(name: 'Cat 1', slug: 'cat-1'));

        $this->setTenant(2);
        $cat2 = $createCategory->handle(new CreateCategoryData(name: 'Cat 2', slug: 'cat-2'));

        $this->setTenant(1);
        $prod1 = $createProduct->handle(new CreateProductData(
            categoryId: (int) $cat1->id,
            name: 'Prod',
            slug: 'prod',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 5,
            stockAlert: 2,
            longDescription: null,
        ));

        $this->setTenant(2);
        $prod2 = $createProduct->handle(new CreateProductData(
            categoryId: (int) $cat2->id,
            name: 'Prod',
            slug: 'prod',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 5,
            stockAlert: 2,
            longDescription: null,
        ));

        $this->assertNotSame($prod1->item->id, $prod2->item->id);

        $this->expectException(DuplicateItemSlugException::class);

        $this->setTenant(1);
        $createProduct->handle(new CreateProductData(
            categoryId: (int) $cat1->id,
            name: 'Prod',
            slug: 'prod',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 5,
            stockAlert: 2,
            longDescription: null,
        ));
    }

    public function test_update_product_uniqueness_is_enforced_within_tenant(): void
    {
        $this->setTenant(1);

        $category = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'Cat', slug: 'cat')
        );

        $createProduct = app(CreateProductCommand::class);
        $updateProduct = app(UpdateProductCommand::class);

        $prodA = $createProduct->handle(new CreateProductData(
            categoryId: (int) $category->id,
            name: 'A',
            slug: 'a',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 1,
            stockAlert: 0,
            longDescription: null,
        ));

        $prodB = $createProduct->handle(new CreateProductData(
            categoryId: (int) $category->id,
            name: 'B',
            slug: 'b',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 2,
            stockAlert: 0,
            longDescription: null,
        ));

        $this->expectException(DuplicateItemSlugException::class);

        $updateProduct->handle(new UpdateProductData(
            productId: (int) $prodA->id,
            categoryId: (int) $category->id,
            name: 'A',
            slug: 'b',
            price: 12,
            description: 'desc2',
            image: null,
            status: true,
            stock: 3,
            stockAlert: 1,
            longDescription: null,
        ));
    }

    public function test_public_catalog_excludes_archived_or_inactive_items(): void
    {
        $this->setTenant(1);

        $category = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'Cat', slug: 'cat')
        );

        $service = app(CreateServiceCommand::class)->handle(new CreateServiceData(
            categoryId: (int) $category->id,
            name: 'Srv',
            slug: 'srv',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $product = app(CreateProductCommand::class)->handle(new CreateProductData(
            categoryId: (int) $category->id,
            name: 'Prod',
            slug: 'prod',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 5,
            stockAlert: 2,
            longDescription: null,
        ));

        app(ArchiveServiceCommand::class)->handle(new ArchiveServiceData(
            serviceId: (int) $service->id,
            active: false,
        ));

        $public = app(ListPublicCatalogQuery::class)->execute();

        $this->assertCount(0, $public->services);
        $this->assertCount(1, $public->products);
        $this->assertCount(1, $public->categories);

        app(ArchiveProductCommand::class)->handle(new ArchiveProductData(
            productId: (int) $product->id,
            active: false,
        ));

        $publicAfter = app(ListPublicCatalogQuery::class)->execute();
        $this->assertCount(0, $publicAfter->products);
        $this->assertCount(0, $publicAfter->categories);
    }

    public function test_archive_affects_private_list_queries(): void
    {
        $this->setTenant(1);

        $category = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'Cat', slug: 'cat')
        );

        $service = app(CreateServiceCommand::class)->handle(new CreateServiceData(
            categoryId: (int) $category->id,
            name: 'Srv',
            slug: 'srv',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $product = app(CreateProductCommand::class)->handle(new CreateProductData(
            categoryId: (int) $category->id,
            name: 'Prod',
            slug: 'prod',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            stock: 5,
            stockAlert: 2,
            longDescription: null,
        ));

        $this->assertCount(1, app(\App\Application\Catalog\Queries\ListServicesQuery::class)->execute());
        $this->assertCount(1, app(\App\Application\Catalog\Queries\ListProductsQuery::class)->execute());

        app(ArchiveServiceCommand::class)->handle(new ArchiveServiceData((int) $service->id, false));
        app(ArchiveProductCommand::class)->handle(new ArchiveProductData((int) $product->id, false));

        $this->assertCount(0, app(\App\Application\Catalog\Queries\ListServicesQuery::class)->execute());
        $this->assertCount(0, app(\App\Application\Catalog\Queries\ListProductsQuery::class)->execute());
    }

    public function test_delete_or_archive_category_fails_when_has_items(): void
    {
        $this->setTenant(1);

        $category = app(CreateCategoryCommand::class)->handle(
            new CreateCategoryData(name: 'Cat', slug: 'cat')
        );

        app(CreateServiceCommand::class)->handle(new CreateServiceData(
            categoryId: (int) $category->id,
            name: 'Srv',
            slug: 'srv',
            price: 10,
            description: 'desc',
            image: null,
            status: true,
            durationTime: 30,
        ));

        $this->expectException(CategoryHasItemsException::class);

        app(DeleteOrArchiveCategoryCommand::class)->handle(
            new DeleteOrArchiveCategoryData((int) $category->id)
        );
    }
}

