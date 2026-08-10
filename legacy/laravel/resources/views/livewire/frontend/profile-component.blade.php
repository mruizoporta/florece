<section id="content">
    <div class="content-wrap">
        <div class="container clearfix">

            <div class="row clearfix">

                <div class="col-md-9">

                    <div class="heading-block border-0">
                        <h3>
                            {{ Auth::user()->name }}
                        </h3>
                    </div>

                    <div class="clear"></div>

                    <div class="row clearfix">

                        <div class="col-lg-12">

                            <div class="tabs tabs-alt clearfix" id="tabs-profile">

                                <ul class="tab-nav clearfix">
                                    <li>
                                        <a href="#tab-feeds">
                                            <i class="icon-calendar1"></i>
                                            Agendas
                                        </a>
                                    </li>
                                </ul>

                                <div class="tab-container">

                                    <div class="tab-content clearfix" id="tab-feeds">

                                        <p class="lead">
                                            A continuación se listan tus agendas.
                                        </p>

                                        @if(session('appointmentCreated'))
                                            <div class="style-msg successmsg">
                                                <div class="sb-msg">
                                                    {{ session('appointmentCreated') }}
                                                </div>
                                            </div>
                                        @endif

                                        <livewire:frontend.appointments.user-list-appointments :customerId="Auth::user()->customer->id" />

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                <div class="w-100 line d-block d-md-none"></div>

                <div class="col-md-3">



                    <div class="fancy-title topmargin title-border">
                        <h4>Mis datos</h4>
                    </div>

                    <div class="list-group">
                        <span href="#" class="list-group-item d-flex justify-content-between">
                            <div>
                                <i class="icon-user-alt"></i>
                                Nombre
                            </div>
                            {{ Auth::user()->name }}
                        </span>

                        <span href="#" class="list-group-item d-flex justify-content-between">
                            <div>
                                <i class="icon-envelope"></i>
                                Correo
                            </div>
                            {{ Auth::user()->email }}
                        </span>

                        <span href="#" class="list-group-item d-flex justify-content-between">
                            <div>
                                <i class="icon-calendar-alt"></i>
                                Registrado el
                            </div>
                            {{ Auth::user()->created_at->format('d-m-Y') }}
                        </span>
                    </div>

                </div>

            </div>

        </div>
    </div>
</section><!-- #content end -->
