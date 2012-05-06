/**
 * webpagemaker modal dialogs
 */
function bindModalJS() {
  document.removeEventListener("DOMContentLoaded", bindModalJS, false);
  
  $("#share_button").click(function() {
    $('#share-dialog').show();
  });

/*
  // clicking outside the dialog  
  $('#share-dialog').click(function(){
    this.parentNode.removeChild(this);
  });
*/

  // persistent choice
  var selector = "";

  // clicking the "close" button
  $('.modal-box .close-icon').click(function(){
    var shareDialog = this.parentNode.parentNode;
    //shareDialog.parentNode.removeChild(shareDialog);
    $(shareDialog).hide();
    selector = "";
  });
  
  var selectItem = function(a, selector) {
    $(selector).show();
  };

  var unselectItem = function(a, selector) {
    $(selector).hide();
  };

  // content "tabs"
  $('#share-buttons a').each(function() {
    // mouseover content replacements
    $(this).mouseover(function() {
      if (selector !== "") { unselectItem(this, selector); }
      selector = "." + this.id;
      selectItem(this, selector);
    });

    // prevent links from being resolved, since the
    // <a> elements have no href content
    $(this).click(function() {
      return false; 
    });
  });

  // effect content placement per button
  $('#share-buttons img').each(function() {
    $(this).mouseover(function() {
      this.src = this.src.replace('chopped','chopped/selected');
    });
    $(this).mouseout(function() {
      this.src=this.src.replace('/selected','');
    });
  });
}

document.addEventListener("DOMContentLoaded", bindModalJS, false);