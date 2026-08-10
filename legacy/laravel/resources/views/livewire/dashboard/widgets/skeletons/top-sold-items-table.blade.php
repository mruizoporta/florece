@php
    $nameKey = $nameHeaderKey ?? 'app.dashboard.table_product';
@endphp
{{-- Encabezado de sección en home-component; skeleton = solo tabla --}}
<div class="shearly-widget-placeholder flex min-h-[16rem] flex-col px-1 pb-3">
<div class="shearly-table-wrap table-responsive">
    <table class="table align-middle mb-0">
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">{{ __($nameKey) }}</th>
                <th scope="col">{{ __('app.dashboard.table_sold_count') }}</th>
                <th scope="col">{{ __('app.dashboard.table_generated') }}</th>
            </tr>
        </thead>
        <tbody>
            @for ($i = 0; $i < 5; $i++)
                <tr class="animate-pulse">
                    <td class="align-middle">
                        <div class="h-11 w-11 shrink-0 rounded-xl bg-brand-primary/15"></div>
                    </td>
                    <td class="align-middle">
                        <div class="h-4 w-40 max-w-[14rem] rounded bg-brand-blush-light/40"></div>
                    </td>
                    <td class="align-middle">
                        <div class="h-4 w-8 rounded bg-brand-blush-light/40"></div>
                    </td>
                    <td class="align-middle">
                        <div class="h-4 w-24 rounded bg-brand-warm/40"></div>
                    </td>
                </tr>
            @endfor
        </tbody>
    </table>
</div>
</div>
