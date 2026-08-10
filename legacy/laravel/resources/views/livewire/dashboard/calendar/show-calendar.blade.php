<div>
    <div wire:ignore id='calendar'></div>

    <div class="toast-container position-fixed top-0 end-0 p-3">
        <div id="liveToast2" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-coreui-autohide="false">
            <div class="toast-body">
                <span id="toastQuestion"></span>
                <div class="mt-2 pt-2 border-top">
                    <button type="button" wire:click="cancelAppointment($event.target.getAttribute('data-appointment-id'))" id="btn-cancel-appointment" class="btn btn-danger btn-sm text-white">Sí, cancelar</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-coreui-dismiss="toast">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    @push('js')
    <script>

        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');

            var today = new Date();
            var todayFormatted = today.toISOString().split('T')[0];

            var calendar = new FullCalendar.Calendar(calendarEl, {

                headerToolbar: {
                left: 'title',
                center: '',
                right: 'dayGridMonth,listMonth,prev,next',
                },

                locales: 'es',

                eventDidMount: function(info) {
                var tooltip = new Tooltip(info.el, {
                title: info.event.extendedProps.description,
                placement: 'top',
                trigger: 'hover',
                container: 'body'
                });
            },

                initialDate: todayFormatted,
                navLinks: false, // can click day/week names to navigate views
                businessHours: true, // display business hours
                editable: false,
                selectable: true,
                dayMaxEvents: true,
                events: [],

                eventDidMount: function(info) {
                    //console.log(info.event.extendedProps.description);
                    var tooltipContent = info.event.extendedProps.description;

                    var tooltip = new Tooltip(info.el, {
                        title: tooltipContent,
                        placement: 'top',
                        trigger: 'hover',
                        container: 'body',
                        html: true // Indica que el contenido es HTML
                    });
                },

                eventClick: (e) => removeAppointment(e),
                //datesSet: (e) => getMonth(e),

            });


            calendar.render();

            function loadAppintments(events){

                events.forEach(function(eventDay) {
                    eventDay.forEach(function(event) {
                        calendar.addEvent({
                            id: event.id,
                            title: event.title,
                            description: event.description,
                            start: event.start,
                            end: event.end,
                            color: event.color
                        });
                    });
                });
            }

            function removeAppointment(e){
                let id = e.event._def.publicId;
                let title = e.event._def.title;

                const toastLiveExample = document.getElementById('liveToast2')

                const deleteButton = toastLiveExample.querySelector('#btn-cancel-appointment');
                deleteButton.setAttribute('data-appointment-id', id);

                toastQuestion.textContent = `¿Deseas cancelar la agenda de *${title}*?`

                const toast = new coreui.Toast(toastLiveExample)
                toast.show()
            }

            /*function getMonth(e){
                let start = e.start;
                let end = e.end;
                //Livewire.dispatch('getMonth', { data: e });
            }*/

            document.addEventListener('livewire:init', () => {
                Livewire.on('loadAppointments', (eventsArray) => {
                    loadAppintments(eventsArray);
                });

                Livewire.on('appointmentCanceled', function(appointment) {
                    let id = appointment[0];
                    console.log(id);


                    let event = calendar.getEventById(id);

                    if (event) {
                        event.setProp('color', '#e55353');
                        calendar.addEvent(event);
                    }
                });
            });

        });

    </script>
    @endpush
</div>
