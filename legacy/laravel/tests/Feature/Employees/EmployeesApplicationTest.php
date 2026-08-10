<?php

namespace Tests\Feature\Employees;

use App\Application\Employees\Commands\ArchiveEmployeeCommand;
use App\Application\Employees\Commands\CreateEmployeeCommand;
use App\Application\Employees\Commands\ReplaceWeeklyScheduleCommand;
use App\Application\Employees\DTOs\ArchiveEmployeeData;
use App\Application\Employees\DTOs\CreateEmployeeData;
use App\Application\Employees\DTOs\ReplaceWeeklyScheduleData;
use App\Application\Employees\Queries\ListPublicEmployeesQuery;
use App\Models\Tenant;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EmployeesApplicationTest extends TestCase
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

        $this->createEmployeesSchema();
    }

    private function createEmployeesSchema(): void
    {
        Schema::connection('sqlite')->dropIfExists('employee_social');
        Schema::connection('sqlite')->dropIfExists('socials');
        Schema::connection('sqlite')->dropIfExists('schedules');
        Schema::connection('sqlite')->dropIfExists('employees');

        Schema::connection('sqlite')->create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('description');
            $table->string('image');
            $table->boolean('status')->default(true);
            $table->boolean('visible_public')->default(true);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('employee_id');
            $table->integer('weekday');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('status')->default(true);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('socials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('icon');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::connection('sqlite')->create('employee_social', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('social_id');
            $table->string('href');
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

    public function test_create_employee_and_replace_weekly_schedule(): void
    {
        $this->setTenant(1);

        $employee = app(CreateEmployeeCommand::class)->handle(new CreateEmployeeData(
            name: 'Ana',
            description: 'Especialista color',
            image: '/img/ana.jpg',
            status: true,
            visiblePublic: true,
        ));

        app(ReplaceWeeklyScheduleCommand::class)->handle(new ReplaceWeeklyScheduleData(
            employeeId: (int) $employee->id,
            weekSlots: [
                1 => [
                    ['start' => '09:00', 'end' => '12:00'],
                    ['start' => '13:00', 'end' => '17:00'],
                ],
                2 => [],
                3 => [],
                4 => [],
                5 => [],
                6 => [],
                7 => [],
            ],
        ));

        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'name' => 'Ana',
            'status' => 1,
            'visible_public' => 1,
            'tenant_id' => 1,
        ], 'sqlite');

        $this->assertDatabaseCount('schedules', 2, 'sqlite');
    }

    public function test_public_list_only_returns_active_and_visible(): void
    {
        $this->setTenant(1);

        app(CreateEmployeeCommand::class)->handle(new CreateEmployeeData(
            name: 'Visible',
            description: 'desc',
            image: '/img/1.jpg',
            status: true,
            visiblePublic: true,
        ));

        app(CreateEmployeeCommand::class)->handle(new CreateEmployeeData(
            name: 'NoVisible',
            description: 'desc',
            image: '/img/2.jpg',
            status: true,
            visiblePublic: false,
        ));

        app(CreateEmployeeCommand::class)->handle(new CreateEmployeeData(
            name: 'Inactivo',
            description: 'desc',
            image: '/img/3.jpg',
            status: false,
            visiblePublic: true,
        ));

        $public = app(ListPublicEmployeesQuery::class)->execute();
        $this->assertCount(1, $public);
        $this->assertSame('Visible', $public->first()->name);
    }

    public function test_archive_deactivates_and_hides_employee_publicly(): void
    {
        $this->setTenant(1);

        $employee = app(CreateEmployeeCommand::class)->handle(new CreateEmployeeData(
            name: 'Ana',
            description: 'desc',
            image: '/img/ana.jpg',
            status: true,
            visiblePublic: true,
        ));

        app(ArchiveEmployeeCommand::class)->handle(new ArchiveEmployeeData((int) $employee->id));

        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'status' => 0,
            'visible_public' => 0,
        ], 'sqlite');
    }
}

