<div class="shearly-widget-placeholder flex min-h-[19rem] flex-col gap-3">
    <p class="shearly-widget-loading-label">{{ __('app.dashboard.loading_appointments') }}</p>
<div class="shearly-table-wrap table-responsive">
    <table class="table align-middle mb-0 shearly-table">
        <thead>
            <tr>
                <th scope="col" class="ps-3">#</th>
                <th scope="col">{{ __('app.dashboard.table_type') }}</th>
                <th scope="col">{{ __('app.dashboard.table_client') }}</th>
                <th scope="col">{{ __('app.dashboard.table_services') }}</th>
                <th scope="col">{{ __('app.dashboard.table_status') }}</th>
                <th scope="col" class="pe-3">{{ __('app.dashboard.table_date') }}</th>
            </tr>
        </thead>
        <tbody>
            @for ($i = 0; $i < 5; $i++)
                <tr class="animate-pulse">
                    <th scope="row" class="ps-3 align-middle">
                        <div class="h-4 w-6 rounded bg-brand-blush-light/40"></div>
                    </th>
                    <td class="align-middle">
                        <div class="h-5 w-14 rounded-full bg-brand-primary/15"></div>
                    </td>
                    <td class="align-middle">
                        <div class="h-4 w-32 rounded bg-brand-blush-light/40"></div>
                    </td>
                    <td class="align-middle">
                        <div class="flex items-center gap-1">
                            <div class="h-5 w-24 rounded-full bg-brand-primary/15"></div>
                            <div class="h-5 w-16 rounded-full bg-brand-primary/15"></div>
                        </div>
                    </td>
                    <td class="align-middle">
                        <div class="h-5 w-20 rounded-full bg-brand-warm/40"></div>
                    </td>
                    <td class="pe-3 align-middle">
                        <div class="h-4 w-28 rounded bg-brand-blush-light/40"></div>
                    </td>
                </tr>
            @endfor
        </tbody>
    </table>
</div>
</div>
