<?php

namespace App\Livewire\Dashboard\Orders;

use Livewire\Component;
use Livewire\Attributes\On;

use App\Livewire\Traits\ImageTrait;

use Facades\App\Livewire\Actions\Dashboard\ItemOrder\DecrementQuantityAction;
use Facades\App\Livewire\Actions\Dashboard\ItemOrder\IncrementQuantityAction;
use Facades\App\Livewire\Actions\Dashboard\ItemOrder\DeleteAction as DeleteItemOrderAction;

use Facades\App\Livewire\Actions\Dashboard\Service\CheckIsServiceAction;

use Facades\App\Livewire\Actions\Dashboard\Product\SufficientStockAction;
use Facades\App\Livewire\Actions\Dashboard\Product\CheckStockAction;
use Facades\App\Livewire\Actions\Dashboard\Product\DecrementStockAction;

use Facades\App\Livewire\Actions\Dashboard\ItemOrder\CreateAction;

use Facades\App\Livewire\Actions\Dashboard\Order\UpdateTotalAction;
use Facades\App\Livewire\Actions\Dashboard\Order\DeleteAction;
use Facades\App\Livewire\Actions\Dashboard\Order\ConfirmOrderAction;

use App\Models\Order;
use App\Models\Item;

class ListOrdersInBackdrop extends Component
{
    use ImageTrait;

    public $items = [];
    public $loadedItems = false;

    public $quantity;

    #[On('refresh-tickets')]
    public function render()
    {
        return view('livewire.dashboard.orders.list-orders-in-backdrop')->with([
            'orders' => Order::with(['customer', 'items.item'])->where('payment_status', false)->orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function decrementQuantity($item)
    {
        $decrement = DecrementQuantityAction::handle($item['id']);

        if(!$decrement){
            return $this->dispatch('notification-danger', [
                'type' => 'danger',
                'title' => 'Acción inválida!',
                'body' => 'No puedes disminuir la cantidad'
            ]);
        }

        UpdateTotalAction::handle($item['order_id']);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Cantidad disminuida'
        ]);

        $this->dispatch('refresh-tickets');
    }

    public function incrementQuantity($item, $currentQuantity)
    {
        $isService = CheckIsServiceAction::handle($item['item_id']);

        if($isService){
            return $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'No puedes aumentar la cantidad de un servicio'
            ]);
        }

        $sufficientStock = SufficientStockAction::handle($item['item_id'], $currentQuantity);

        if(!$sufficientStock){
            return $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'Stock insuficiente'
            ]);

        }

        IncrementQuantityAction::handle($item['id']);

        UpdateTotalAction::handle($item['order_id']);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Cantidad aumentada'
        ]);

        $this->dispatch('refresh-tickets');
    }

    public function deleteItemOrder($item, $order_id, $item_name)
    {
        DeleteItemOrderAction::handle($item);

        UpdateTotalAction::handle($order_id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Se eliminó ' . $item_name
        ]);

        $this->dispatch('refresh-tickets');
    }

    public function loadItems()
    {
        if(!$this->loadedItems){
            $this->items = Item::orderBy('name', 'asc')->get();
        }

        $this->loadedItems = true;
    }

    public function addItem($order, $item, $item_name)
    {
        $sufficientStock = SufficientStockAction::handle($item);

        if(!$sufficientStock){
            return $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'Stock insuficiente'
            ]);

        }

        $firstOrCreate = CreateAction::handle($order, $item);

        if ($firstOrCreate->wasRecentlyCreated) {
            $this->dispatch('notification-success', [
                'type' => 'success',
                'title' => 'Acción exitosa!',
                'body' => 'Se añadío *' . $item_name . '*'
            ]);

            return UpdateTotalAction::handle($order);
        }

        $this->dispatch('notification-warning', [
            'type' => 'warning',
            'title' => 'Atención!',
            'body' => 'Ya existe *' . $item_name . '*'
        ]);
    }

    public function cancelOrder($order)
    {
        DeleteAction::handle($order);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Ticket cancelado'
        ]);

        $this->dispatch('refresh-tickets');
    }

    public function confirmOrder(Order $order)
    {
        $order->loadMissing('items.item');

        /**
         * Checkear que haya stock
         */
        foreach($order->items as $item){
            $sufficientStock = CheckStockAction::handle($item->item_id, $item->quantity);

            if(!$sufficientStock){
                return $this->dispatch('notification-warning', [
                    'type' => 'warning',
                    'title' => 'Disminuye la cantidad!',
                    'body' => 'El stock de ' . $item->item->name . ' es insuficiente.'
                ]);
            }
        }

        ConfirmOrderAction::handle($order->id);

        /**
         * Luego de confirmar el ticket, debemos realizar la resta de stock de los productos.
         */
        DecrementStockAction::handle($order);


        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Ticket confirmado'
        ]);

        $this->dispatch('refresh-tickets');
    }
}
