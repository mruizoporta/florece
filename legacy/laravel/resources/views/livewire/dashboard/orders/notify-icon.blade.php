@if ($quantity > 0)
    <span class="absolute -top-1.5 -right-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
        {{ $quantity > 99 ? '99+' : $quantity }}
    </span>
@endif
