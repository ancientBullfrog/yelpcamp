(function() {
	'use strict';
	const forms = document.querySelectorAll('.needs-validation');

	//return if no forms to validate / or move <script> tags to relevent files
	if (!forms.length) return;

	Array.from(forms).forEach(function(form) {
		form.addEventListener(
			'submit',
			function(e) {
				if (!form.checkValidity()) {
					e.preventDefault();
					e.stopPropagation();
				}
				form.classList.add('was-validated');
			},
			false
		);
	});
})();
//move the script tags for this function to the .ejs where forms are held
