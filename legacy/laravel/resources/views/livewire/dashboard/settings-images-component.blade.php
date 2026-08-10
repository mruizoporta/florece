<div>
    @section('nav-content')
        <li class="breadcrumb-item active"><span>Configuración</span></li>
    @endsection

    <div class="row mb-4">

        <div class="col-sm-12 col-md-6 col-lg-6">
            <div class="card h-100 mb-4">
                <div class="card-header">
                    <strong># Logo</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-logo :logo="$setting->logo"/>
                </div>
            </div>
        </div>

        <div class="col-sm-12 col-md-6 col-lg-6">
            <div class="card h-100 mb-4">
                <div class="card-header">
                    <strong># Banner</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-banner :banner="$setting->banner"/>
                </div>
            </div>
        </div>

    </div>

    <div class="row">

        <div class="container">
            <div class="alert alert-info" role="alert">
                Se recomienda que las imagenes de los laterales sean del mismo tamaño o relación de aspecto.
            </div>
        </div>

        <div class="col-sm-12 col-md-4 col-lg-4">

            <div class="card mb-4">
                <div class="card-header">
                    <strong># Imagen lateral izquierda</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-image-left :image_left="$setting->image_left"/>
                </div>
            </div>
        </div>

        <div class="col-sm-12 col-md-4 col-lg-4">
            <div class="card mb-4">
                <div class="card-header">
                    <strong># Imagen parallax</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-image-parallax :image_parallax="$setting->image_parallax"/>
                </div>
            </div>
        </div>

        <div class="col-sm-12 col-md-4 col-lg-4">
            <div class="card mb-4">
                <div class="card-header">
                    <strong># Imagen lateral derecha</strong>
                </div>
                <div class="card-body">
                    <livewire:dashboard.settings.update-image-right :image_right="$setting->image_right"/>
                </div>
            </div>
        </div>

    </div>
</div>
