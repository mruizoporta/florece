<div>
    @section('nav-content')
        <li class="breadcrumb-item active"><span>Mi cuenta</span></li>
    @endsection

    <div class="row">

        <div class="col-sm-12 col-md-6 col-lg-8">
            <div class="card mb-4">
                <div class="card-header">
                    <strong># Mis datos</strong>
                </div>

                <div class="card-body">
                    <livewire:dashboard.settings.update-setting :setting="$setting"/>
                </div>
            </div>

        </div>

        <div class="col-sm-12 col-md-6 col-lg-4">

            <div class="card mb-4">
                <div class="card-header">
                    <strong># Avatar</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-logo :logo="$setting->logo"/>
                </div>
            </div>

            <div class="card mb-4">
                <div class="card-header">
                    <strong># Modificar contraseña</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-banner :banner="$setting->banner"/>
                </div>
            </div>

        </div>

    </div>
</div>
