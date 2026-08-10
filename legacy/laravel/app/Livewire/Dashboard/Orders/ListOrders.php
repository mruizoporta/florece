<?php

namespace App\Livewire\Dashboard\Orders;

use Livewire\Component;
use Livewire\WithPagination;

use Facades\App\Livewire\Actions\Dashboard\Product\IncrementStockAction;
use Facades\App\Livewire\Actions\Dashboard\Order\DeleteAction;
use Facades\App\Livewire\Actions\Dashboard\ItemOrder\DeleteAction as DeleteItemOrderAction;

use App\Livewire\Traits\ImageTrait;

use App\Models\Order;

class ListOrders extends Component
{
    use ImageTrait;
    use WithPagination;

    protected $paginationTheme = 'bootstrap';

    public $search;

    #[On('changed-search')]
    public function changedSearch($value)
    {
        $this->resetPage();
        $this->search = $value;
    }

    public function delete(Order $order)
    {
        foreach($order->items as $item){
            DeleteItemOrderAction::handle($item->id);

            /**
             * Unicamente se realiza devolución de stock para aquellos tickets que fueron pagos
             */
            if($order->payment_status){
                IncrementStockAction::handle($item->item_id, $item->quantity);
            }

        }

        DeleteAction::handle($order->id);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Ticket eliminado'
        ]);
    }

    #[On('refresh-orders')]
    public function render()
    {
        $orders = Order::query()->with(['items.item']);

        if($this->search){
            $orders->where('name', 'like', '%' . $this->search . '%');
        }
        return view('livewire.dashboard.orders.list-orders')->with([
            'orders' => $orders->paginate(5)
        ]);
    }
}
