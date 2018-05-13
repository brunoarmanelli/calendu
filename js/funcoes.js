$(document).on('click', '#target', function(event) {
  event.preventDefault();      
  $(this).closest('#target').find('.esconde').toggle();
        
});