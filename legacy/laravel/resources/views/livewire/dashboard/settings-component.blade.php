<div>
    @section('nav-content')
        <li class="breadcrumb-item active"><span>Configuración</span></li>
    @endsection

    <div class="row">

        <div class="col-sm-12 col-md-6 col-lg-8">
            <div class="card mb-4">
                <div class="card-header">
                    <strong># Configuración</strong>
                </div>

                <div class="card-body">
                    <livewire:dashboard.settings.update-setting :setting="$setting"/>
                </div>
            </div>

        </div>

        <div class="col-sm-12 col-md-6 col-lg-4">

            <div class="card mb-4">
                <div class="card-header">
                    <strong># Agenda web</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-active-appointment />
                </div>
            </div>

            <div class="card mb-4">
                <div class="card-header">
                    <strong># Whatsapp</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-whatsapp :whatsapp="$setting->whatsapp"/>
                </div>
            </div>

            <div class="card mb-4">
                <div class="card-header">
                    <strong># Mapa</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-embedded-content-map :embedded_content_map="$setting->embedded_content_map"/>
                </div>
            </div>

        </div>

    </div>
</div>
