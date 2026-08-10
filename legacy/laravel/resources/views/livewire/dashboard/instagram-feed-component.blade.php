<div>
    @section('nav-content')
        <li class="breadcrumb-item active"><span>Instagram</span></li>
    @endsection

    <!-- modal how to insert a new feed -->
    @include('livewire.dashboard.instagram.faq-modal')

    <div class="card mb-4">
        <div class="card-header">
            <strong>Nuevo feed</strong>
        </div>

        <div class="card-body">

            <p class="lead">
                <a href="javascript:void(0)" style="text-decoration: none" data-coreui-toggle="modal" data-coreui-target="#modal-instagram-feed-faq">
                    ¿Cómo inserto contenido?
                </a>
            </p>

            <livewire:dashboard.instagram.create-instagram-feed />

        </div>
    </div>

    <div class="card mb-4">
        <div class="card-header">
            <strong>Feed de instagram</strong>
        </div>

        <div class="card-body">

            <livewire:dashboard.instagram.list-instagram-feeds />

        </div>
    </div>
</div>
