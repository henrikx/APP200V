function validateImage(input) {
    const errorDiv = document.getElementById('image-error');
    const imgPreview = document.querySelector('img');
    errorDiv.style.display = 'none';
  
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const image = new Image();
        image.src = e.target.result;
        
        image.onload = function() {
          if (this.naturalWidth > 300 || this.naturalHeight > 300) {
            errorDiv.textContent = 'Image must be 300x300 pixels or smaller';
            errorDiv.style.display = 'block';
            input.value = '';
            imgPreview.src = 'placeholder.jpg';
          } else {
            imgPreview.src = e.target.result;
          }
        };
      };
      reader.readAsDataURL(file);
    }
  }