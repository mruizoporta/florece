<?php

namespace Tests\Feature\Orders;

use App\Application\Orders\Commands\AddOrderItemCommand;
use App\Application\Orders\Commands\CancelOrderCommand;
use App\Application\Orders\Commands\CreateOrderCommand;
use App\Application\Orders\Commands\FinalizeOrderCommand;
use App\Application\Orders\Commands\RemoveOrderItemCommand;
use App\Application\Orders\Commands\SyncOrderPaymentsCommand;
use App\Application\Orders\Commands\UpdateOrderItemQuantityCommand;
use App\Application\Orders\DTOs\AddOrderItemData;
use App\Application\Orders\DTOs\CancelOrderData;
use App\Application\Orders\DTOs\CreateOrderData;
use App\Application\Orders\DTOs\FinalizeOrderData;
use App\Application\Orders\DTOs\RemoveOrderItemData;
use App\Application\Orders\DTOs\SyncOrderPaymentsData;
use App\Application\Orders\DTOs\UpdateOrderItemQuantityData;
use App\Application\Orders\Queries\GetOrderDetailQuery;
use App\Application\Orders\Queries\ListOrdersQuery;
use App\Application\Orders\Queries\OrdersSummaryReportQuery;
use App\Models\Tenant;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrdersApplicationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);
        config(['database.connections.sqlite.prefix' => '']);
        config(['database.connections.sqlite.foreign_key_constraints' => false]);
        DB::purge('sqlite');
        DB::purge('pgsql');

        $this->createOrdersSchema();
    }

    private function createOrdersSchema(): void
    {
        Schema::connection('sqlite')->dropIfExists('order_payments');
        Schema::connection('sqlite')->dropIfExists('item_order');
        Schema::connection('sqlite')->dropIfExists('orders');
        Schema::connection('sqlite')->dropIfExists('products');
        Schema::connection('sqlite')->dropIfExists('items');
        Schema::connection('sqlite')->dropIfExists('customers');
        Schema::connection('sqlite')->dropIfExists('employees');

        Schema::connection('sqlite')->create('customers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('description')->default('');
            $table->string('image')->default('');
            $table->boolean('status')->default(true);
            $table->boolean('visible_public')->default(true);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('name');
            $table->string('slug')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('item_id');
            $table->integer('stock')->default(0);
            $table->integer('stock_alert')->default(0);
            $table->text('long_description')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->boolean('payment_status')->default(false);
            $table->string('name');
            $table->string('status', 20)->default('draft');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('discount_total', 10, 2)->default(0);
            $table->decimal('tax_total', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamp('finalized_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_reason')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        Schema::connection('sqlite')->create('item_order', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('item_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('order_id');
            $table->decimal('price', 10, 2)->default(0);
            $table->string('product_name_snapshot')->nullable();
            $table->decimal('unit_price_snapshot', 10, 2)->default(0);
            $table->decimal('line_discount', 10, 2)->default(0);
            $table->decimal('line_tax', 10, 2)->default(0);
            $table->decimal('line_total', 10, 2)->default(0);
            $table->integer('quantity')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();
        });

        Schema::connection('sqlite')->create('order_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->string('method');
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('reference')->nullable();
            $table->timestamp('paid_at')->nullable();
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

    private function seedProduct(string $name, float $price, int $stock): int
    {
        $itemId = DB::connection('sqlite')->table('items')->insertGetId([
            'tenant_id' => 1,
            'name' => $name,
            'slug' => strtolower($name),
            'price' => $price,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::connection('sqlite')->table('products')->insertGetId([
            'tenant_id' => 1,
            'item_id' => $itemId,
            'stock' => $stock,
            'stock_alert' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_create_add_update_remove_and_list_detail(): void
    {
        $this->setTenant(1);
        $productId = $this->seedProduct('Shampoo', 10, 20);

        $order = app(CreateOrderCommand::class)->handle(new CreateOrderData(
            customerId: null,
            employeeId: null,
            name: 'Venta mostrador',
        ));

        $order = app(AddOrderItemCommand::class)->handle(new AddOrderItemData((int) $order->id, $productId, 2));
        $this->assertSame(20.0, (float) $order->total);

        $itemOrderId = (int) $order->items->first()->id;
        $order = app(UpdateOrderItemQuantityCommand::class)->handle(new UpdateOrderItemQuantityData(
            orderId: (int) $order->id,
            itemOrderId: $itemOrderId,
            quantity: 3,
        ));
        $this->assertSame(30.0, (float) $order->total);

        $list = app(ListOrdersQuery::class)->execute();
        $this->assertCount(1, $list);

        $detail = app(GetOrderDetailQuery::class)->execute((int) $order->id);
        $this->assertCount(1, $detail->items);

        $order = app(RemoveOrderItemCommand::class)->handle(new RemoveOrderItemData(
            orderId: (int) $order->id,
            itemOrderId: $itemOrderId,
        ));
        $this->assertSame(0.0, (float) $order->total);
    }

    public function test_finalize_success_discounts_stock_and_cancel_replenishes(): void
    {
        $this->setTenant(1);
        $productId = $this->seedProduct('Cera', 25, 10);

        $order = app(CreateOrderCommand::class)->handle(new CreateOrderData(null, null, 'POS'));
        $order = app(AddOrderItemCommand::class)->handle(new AddOrderItemData((int) $order->id, $productId, 2));
        $order = app(SyncOrderPaymentsCommand::class)->handle(new SyncOrderPaymentsData((int) $order->id, [
            ['method' => 'cash', 'amount' => 50.0],
        ]));

        $finalized = app(FinalizeOrderCommand::class)->handle(new FinalizeOrderData((int) $order->id));
        $this->assertSame('finalized', $finalized->status);
        $this->assertDatabaseHas('products', ['id' => $productId, 'stock' => 8], 'sqlite');

        $cancelled = app(CancelOrderCommand::class)->handle(new CancelOrderData((int) $order->id, 'Anulada'));
        $this->assertSame('cancelled', $cancelled->status);
        $this->assertDatabaseHas('products', ['id' => $productId, 'stock' => 10], 'sqlite');
    }

    public function test_finalize_fails_without_stock(): void
    {
        $this->setTenant(1);
        $productId = $this->seedProduct('Gel', 12, 1);

        $order = app(CreateOrderCommand::class)->handle(new CreateOrderData(null, null, 'POS'));
        app(AddOrderItemCommand::class)->handle(new AddOrderItemData((int) $order->id, $productId, 2));
        app(SyncOrderPaymentsCommand::class)->handle(new SyncOrderPaymentsData((int) $order->id, [
            ['method' => 'cash', 'amount' => 24.0],
        ]));

        $this->expectException(\DomainException::class);
        app(FinalizeOrderCommand::class)->handle(new FinalizeOrderData((int) $order->id));
    }

    public function test_summary_report_counts_finalized_orders(): void
    {
        $this->setTenant(1);
        $productId = $this->seedProduct('Peine', 5, 10);

        $order = app(CreateOrderCommand::class)->handle(new CreateOrderData(null, null, 'POS'));
        app(AddOrderItemCommand::class)->handle(new AddOrderItemData((int) $order->id, $productId, 2));
        app(SyncOrderPaymentsCommand::class)->handle(new SyncOrderPaymentsData((int) $order->id, [
            ['method' => 'card', 'amount' => 10.0],
        ]));
        app(FinalizeOrderCommand::class)->handle(new FinalizeOrderData((int) $order->id));

        $summary = app(OrdersSummaryReportQuery::class)->execute();
        $this->assertSame(1, $summary['orders_count']);
        $this->assertSame(10.0, $summary['total_sales']);
    }
}

