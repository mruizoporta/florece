@props(['responsive' => true])

@if($responsive)
    <div class="table-responsive shearly-table-wrap">
        <table {{ $attributes->class('table shearly-table') }}>
            {{ $slot }}
        </table>
    </div>
@else
    <table {{ $attributes->class('table shearly-table') }}>
        {{ $slot }}
    </table>
@endif

