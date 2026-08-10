@php
    $totalAppointments = $flashAppointmentsCount + $localAppointmentsCount + $webAppointmentsCount;
@endphp

@if($totalAppointments === 0)
    {{-- Empty state elegante --}}
    <div class="flex flex-col items-center justify-center gap-3 py-10 text-center px-4">
        <span class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"/>
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"/>
            </svg>
        </span>
        <p class="text-sm font-semibold text-brand-ink">Sin datos todavía</p>
        <p class="text-xs text-brand-ink-muted max-w-[180px] leading-relaxed">
            La distribución por tipo de cita aparecerá aquí cuando haya registros.
        </p>
    </div>
@else
    <div class="c-chart-wrapper px-2" style="max-height: 280px;">
        <canvas id="canvas-type-of-appointments-chart" class="mx-auto" style="max-height: 260px;"></canvas>

        @push('js')
            <script src="{{ asset('coreui/vendors/chart.js/js/chart.min.js') }}"></script>
            <script>
                const doughnutChart = new Chart(document.getElementById('canvas-type-of-appointments-chart'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Flash', 'Local', 'Web'],
                        datasets: [{
                            data: [
                                {{ $flashAppointmentsCount }},
                                {{ $localAppointmentsCount }},
                                {{ $webAppointmentsCount }}
                            ],
                            backgroundColor: ['#FFD200', '#C49A7C', '#C96B6B'],
                            hoverBackgroundColor: ['#E6BD00', '#B8896E', '#B34D4D'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 16,
                                    font: { family: 'DM Sans', size: 12 },
                                    color: '#6B7280'
                                }
                            }
                        }
                    }
                });
            </script>
        @endpush
    </div>
@endif

