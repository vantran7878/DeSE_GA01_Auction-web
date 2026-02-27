function confirmDeleteEntity(button, config) {
  // config = { idAttr, nameAttr, entityLabel, actionUrl }
  // button = element được click (truyền `this` từ onclick)
  const entityId   = button.dataset[config.idAttr];
  const entityName = button.dataset[config.nameAttr];

  Swal.fire({
    title:              'Are you sure?',
    html:               `You are about to delete ${config.entityLabel}: <strong>${entityName}</strong><br>This action cannot be undone!`,
    icon:               'warning',
    showCancelButton:   true,
    confirmButtonColor: '#d33',
    cancelButtonColor:  '#6c757d',
    confirmButtonText:  'Yes, delete it!',
    cancelButtonText:   'Cancel'
  }).then(result => {
    if (!result.isConfirmed) return;

    // Tạo form POST rồi submit
    const form  = document.createElement('form');
    form.method = 'POST';
    form.action = config.actionUrl;

    const input  = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'id';
    input.value = entityId;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  });
}