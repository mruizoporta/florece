<?php

namespace App\Livewire\Dashboard\Products;

use Livewire\Component;
use Livewire\WithPagination;
use Livewire\Attributes\On;
use App\Livewire\Traits\ImageTrait;

use App\Models\Product;

class ListProducts extends Component
{
    use ImageTrait;
    use WithPagination;

    protected $paginationTheme = 'bootstrap';

    public $search;

    public function placeholder()
    {
        return <<<'HTML'
        <div class="text-center my-5 py-5">
            <div class="spinner-grow text-dark" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
        HTML;
    }

    #[On('changed-search')]
    public function changedSearch($value)
    {
        $this->resetPage();
        $this->search = $value;
    }

    public function render()
    {
        $products = Product::query();

        if($this->search){
            $products->join('items', 'products.item_id', '=', 'items.id')
                ->where('items.name', 'like', '%' . $this->search . '%');
        }

        return view('livewire.dashboard.products.list-products')->with([
            'products' => $products->with(['item.category'])->paginate(5)
        ]);
    }
}
