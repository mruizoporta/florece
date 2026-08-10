<div class="row">
    <div class="col-sm-12 col-md-6 col-lg-4">

        <div class="card mb-4">
            <div class="card-header">
                <strong># Acerca de</strong>
            </div>

            <div class="card-body">
                <!-- about_us_show_section -->
                <div class="form-check form-switch">
                    <input wire:model.live="form.about_us_show_section"
                        wire:change="changeStatus('about_us_show_section')"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="toggleAboutUsShowSection"
                        @if($this->form->about_us_show_section) checked @endif
                    >
                    <label class="form-check-label" for="toggleAboutUsShowSection">Mostrar sección</label>
                </div><!-- about_us_show_section -->

                <form wire:submit="update">
                    <!-- about_us_text -->
                    <div class="my-3">
                        <x-input-text name="form.about_us_text" label="Título" type="text" wire:model.blur="form.about_us_text" wire:keyup.enter="update('about_us_text')" />
                    </div><!-- ./about_us_text -->

                    <!-- about_us_icon -->
                    <div class="my-3">
                        <x-input-text name="form.about_us_icon" label="Icono" type="text" wire:model.blur="form.about_us_icon" wire:keyup.enter="update('about_us_icon')" />
                    </div><!-- ./about_us_icon -->
                </form>

            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header">
                <strong># Servicios</strong>
            </div>

            <div class="card-body">

                <!-- services_show_section -->
                <div class="form-check form-switch">
                    <input wire:model.live="form.services_show_section"
                        wire:change="changeStatus('services_show_section')"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="toggleServicesShowSection"
                        @if($this->form->services_show_section) checked @endif
                    >
                    <label class="form-check-label" for="toggleServicesShowSection">Mostrar sección</label>
                </div><!-- ./services_show_section -->

                <!-- services_text -->
                <div class="my-3">
                    <x-input-text name="form.services_text" label="Título" type="text" wire:model.blur="form.services_text" wire:keyup.enter="update('services_text')" />
                </div><!-- ./services_text -->

                <!-- services_icon -->
                <div class="my-3">
                    <x-input-text name="form.services_icon" label="Icono" type="text" wire:model.blur="form.services_icon" wire:keyup.enter="update('services_icon')" />
                </div><!-- ./services_icon -->

            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header">
                <strong># Instagram</strong>
            </div>

            <div class="card-body">

                <!-- instagram_show_section -->
                <div class="form-check form-switch">
                    <input wire:model.live="form.instagram_show_section"
                        wire:change="changeStatus('instagram_show_section')"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="toggleInstagramShowSection"
                        @if($this->form->instagram_show_section) checked @endif
                    >
                    <label class="form-check-label" for="toggleInstagramShowSection">Mostrar sección</label>
                </div><!-- ./instagram_show_section -->

                <!-- instagram_text -->
                <div class="my-3">
                    <x-input-text name="form.instagram_text" label="Título" type="text" wire:model.blur="form.instagram_text" wire:keyup.enter="update('instagram_text')" />
                </div><!-- ./instagram_text -->

                <!-- instagram_icon -->
                <div class="my-3">
                    <x-input-text name="form.instagram_icon" label="Icono" type="text" wire:model.blur="form.instagram_icon" wire:keyup.enter="update('instagram_icon')" />
                </div><!-- ./instagram_icon -->

            </div>
        </div>
    </div>

    <div class="col-sm-12 col-md-6 col-lg-4">
        <div class="card mb-4">
            <div class="card-header">
                <strong># Empleados</strong>
            </div>

            <div class="card-body">

                <!-- employees_show_section -->
                <div class="form-check form-switch">
                    <input wire:model.live="form.employees_show_section"
                        wire:change="changeStatus('employees_show_section')"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="toggleEmployeesShowSection"
                        @if($this->form->employees_show_section) checked @endif
                    >
                    <label class="form-check-label" for="toggleEmployeesShowSection">Mostrar sección</label>
                </div><!-- ./employees_show_section -->

                <!-- employees_text -->
                <div class="my-3">
                    <x-input-text name="form.employees_text" label="Título" type="text" wire:model.blur="form.employees_text" wire:keyup.enter="update('employees_text')" />
                </div><!-- ./employees_text -->

                <!-- employees_icon -->
                <div class="my-3">
                    <x-input-text name="form.employees_icon" label="Icono" type="text" wire:model.blur="form.employees_icon" wire:keyup.enter="update('employees_icon')" />
                </div><!-- ./employees_icon -->

            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header">
                <strong># Productos</strong>
            </div>

            <div class="card-body">

                 <!-- products_show_section -->
                 <div class="form-check form-switch">
                    <input wire:model.live="form.products_show_section"
                        wire:change="changeStatus('products_show_section')"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="toggleProductsShowSection"
                        @if($this->form->products_show_section) checked @endif
                    >
                    <label class="form-check-label" for="toggleProductsShowSection">Mostrar sección</label>
                </div><!-- ./products_show_section -->

                <!-- products_text -->
                <div class="my-3">
                    <x-input-text name="form.products_text" label="Título" type="text" wire:model.blur="form.products_text" wire:keyup.enter="update('products_text')" />
                </div><!-- ./products_text -->

                <!-- products_icon -->
                <div class="my-3">
                    <x-input-text name="form.products_icon" label="Icono" type="text" wire:model.blur="form.products_icon" wire:keyup.enter="update('products_icon')" />
                </div><!-- ./products_icon -->

            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header">
                <strong># Whatsapp</strong>
            </div>

            <div class="card-body">

                 <!-- whatsapp_show_section -->
                 <div class="form-check form-switch">
                    <input wire:model.live="form.whatsapp_show_section"
                        wire:change="changeStatus('whatsapp_show_section')"
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="toggleWhatsappShowSection"
                        @if($this->form->whatsapp_show_section) checked @endif
                    >
                    <label class="form-check-label" for="toggleWhatsappShowSection">Mostrar sección</label>
                </div><!-- ./whatsapp_show_section -->

                <!-- whatsapp_title_1 -->
                <div class="my-3">
                    <x-input-text name="form.whatsapp_title_1" label="Título 1" type="text" wire:model.blur="form.whatsapp_title_1" wire:keyup.enter="update('whatsapp_title_1')" />
                </div><!-- ./whatsapp_title_1 -->

                 <!-- whatsapp_title_2 -->
                 <div class="my-3">
                    <x-input-text name="form.whatsapp_title_2" label="Título 2" type="text" wire:model.blur="form.whatsapp_title_2" wire:keyup.enter="update('whatsapp_title_2')" />
                </div><!-- ./whatsapp_title_2 -->

                 <!-- whatsapp_title_3 -->
                 <div class="my-3">
                    <x-input-text name="form.whatsapp_title_3" label="Título 3" type="text" wire:model.blur="form.whatsapp_title_3" wire:keyup.enter="update('whatsapp_title_3')" />
                </div><!-- ./whatsapp_title_3 -->

                <!-- whatsapp_icon -->
                <div class="my-3">
                    <x-input-text name="form.whatsapp_icon" label="Icono" type="text" wire:model.blur="form.whatsapp_icon" wire:keyup.enter="update('whatsapp_icon')" />
                </div><!-- ./whatsapp_icon -->

                <!-- btn_whatsapp_button_text -->
                <div class="my-3">
                    <x-input-text name="form.btn_whatsapp_button_text" label="Texto del botón" type="text" wire:model.blur="form.btn_whatsapp_button_text" wire:keyup.enter="update('btn_whatsapp_button_text')" />
                </div><!-- ./btn_whatsapp_button_text -->

            </div>
        </div>
    </div>

    <div class="col-sm-12 col-md-12 col-lg-4">
        <div class="card mb-4">
            <div class="card-header">
                <strong># Estilos</strong>
            </div>

            <livewire:dashboard.settings.update-styles />
        </div>
    </div>

</div>
