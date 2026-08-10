<div>

    <div class="accordion mb-3" id="accordionExample">
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-coreui-toggle="collapse"
                    data-coreui-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                    Ayuda
                </button>
            </h2>
            <div id="collapseTwo" class="accordion-collapse collapse" data-coreui-parent="#accordionExample">
                <div class="accordion-body">
                    Establezca a continuación como se llevará a cabo la agenda web.
                    Ambos conceptos se explican de forma detallada en la <strong>documentación</strong>.
                </div>
            </div>
        </div>
    </div>

    <div class="form-check">
        <input wire:change="changeAppointmentType('blacklist')" class="form-check-input" type="radio" name="appointmentType" id="radioBlacklist" @if($appointment_type == 'blacklist') checked @endif>
        <label class="form-check-label" for="radioBlacklist">
            Blacklist
        </label>
    </div>
    <div class="form-check">
        <input wire:change="changeAppointmentType('whitelist')" class="form-check-input" type="radio" name="appointmentType" id="radioWhitelist" @if($appointment_type == 'whitelist') checked @endif>
        <label class="form-check-label" for="radioWhitelist">
            Whitelist
        </label>
    </div>

    @error('form.appointment_type')<div class="text-danger">{{ $message }}</div>@enderror

</div>
