<div>
    <div class="form-check form-switch">
        <input wire:model.live="form.about_us_show_section" wire:change="changeStatus" class="form-check-input"
            type="checkbox" role="switch" id="toggleActiveAppointment"
            @if ($active_appointment) checked @endif>
        <label class="form-check-label" for="toggleActiveAppointment">Agenda web activa</label>
    </div>
</div>
