<div class="shearly-table-wrap table-responsive px-1 pb-3">
    <table class="table align-middle mb-0">
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">{{ __('app.dashboard.table_service') }}</th>
                <th scope="col">{{ __('app.dashboard.table_sold_count') }}</th>
                <th scope="col">{{ __('app.dashboard.table_generated') }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($topServicesSold as $service)
            <tr>
                <td>
                    <div class="relative shrink-0 w-11 h-11">
                        <img src="{{ asset($this->verySmall('storage/items/', $service->image)) }}"
                             class="w-11 h-11 rounded-xl object-cover border border-brand-blush-light/60"
                             alt="{{ $service->name }}"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                             loading="lazy">
                        <span style="display:none"
                              class="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20
                                     items-center justify-center text-base font-semibold text-brand-primary-dark select-none">
                            {{ mb_strtoupper(mb_substr($service->name, 0, 1)) }}
                        </span>
                    </div>
                </td>
                <td class="fw-medium text-brand-ink">{{ $service->name }}</td>
                <td class="tabular-nums">{{ $service->total_sold }}</td>
                <td class="tabular-nums text-brand-ink-muted">{{ number_format($service->total_amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
