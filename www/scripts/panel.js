
$(function () {
  //init user panel
  $('.draggable').draggble();
  $('#btnPanel').click(function () {
    $('.draggable').show(500);
  });
});