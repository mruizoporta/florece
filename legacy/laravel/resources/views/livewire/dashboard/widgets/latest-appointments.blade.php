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
            @forelse($latestAppointments as $appointment)
            <tr>
                <th scope="row" class="text-slate-500 small ps-3">{{ $appointment->id }}</th>
                <td class="text-nowrap">
                    <span class="badge rounded-pill px-2 py-1 fw-semibold border border-1 bg-{{ $appointment->type->bg_color }}">
                        {{ $appointment->type->name }}
                    </span>
                </td>
                <td class="text-dark fw-medium">
                    @if($appointment->type == 'local')
                        {{ $appointment->name }}
                    @else
                        {{ $appointment->customer->user->name }}
                    @endif
                </td>
                <td class="text-nowrap">
                    <div class="flex items-center -space-x-1.5">
                        @foreach($appointment->services as $service)
                        <div class="relative shrink-0" title="{{ $service->item->name }}">
                            <img class="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"
                                 src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}"
                                 alt="{{ $service->item->name }}"
                                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                                 loading="lazy">
                            <span style="display:none"
                                  class="w-7 h-7 rounded-full border-2 border-white bg-brand-primary/15
                                         items-center justify-center text-[10px] font-semibold text-brand-primary-dark select-none">
                                {{ mb_strtoupper(mb_substr($service->item->name, 0, 1)) }}
                            </span>
                        </div>
                        @endforeach
                    </div>
                </td>
                <td><span class="badge rounded-pill px-2 py-1 fw-semibold border border-1 bg-{{ $appointment->status->bg_color }}">{{ $appointment->status->name }}</span></td>
                <td class="text-nowrap small text-slate-500 pe-3">{{ \Carbon\Carbon::parse($appointment->start_time)->format('d-m-Y H:i') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="text-center py-4 text-slate-500 small">
                    {{ __('app.dashboard.table_empty') }}
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
