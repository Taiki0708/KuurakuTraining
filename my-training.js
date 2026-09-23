(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const api = window.ServeUpProgress;
  const courseNames = {
    'customer-service': 'Customer Service',
    'food-safety': 'Food Safety',
    'japanese-hospitality': 'Japanese Hospitality',
    'restaurant-basics': 'Restaurant Basics',
    'restaurant-orientation': 'Restaurant Orientation',
    'hygiene-food-safety': 'Hygiene & Food Safety',
    'guest-service-basics': 'Guest Service Basics',
    'workplace-communication': 'Workplace Communication',
    'allergies-dietary': 'Allergies & Dietary Requirements',
    'safety-emergency': 'Safety & Emergency',
    'order-serving-payment': 'Order, Serving & Payment',
    'complaints-difficult': 'Complaints & Difficult Situations'
  };
  const certificateKeys = {
    'customer-service': 'customerServiceCompleted',
    'food-safety': 'foodSafetyCompleted',
    'japanese-hospitality': 'japaneseHospitalityCompleted',
    'restaurant-basics': 'restaurantBasicsCompleted'
  };

  function setIdentity(name, email) {
    const display = name?.trim() || email;
    $('welcomeName').textContent = display;
    $('accountEmail').textContent = email;
    $('displayName').value = name?.trim() || '';
    $('profileInitial').textContent = (display.trim()[0] || 'S').toUpperCase();
  }

  function emptyItem(message) {
    const item = document.createElement('li');
    item.className = 'empty-item';
    item.textContent = message;
    return item;
  }

  function courseItem(title, detail, href) {
    const item = document.createElement('li');
    const name = document.createElement(href ? 'a' : 'strong');
    name.textContent = title;
    if (href) name.href = href;
    const meta = document.createElement('small');
    meta.textContent = detail;
    item.append(name, meta);
    return item;
  }

  function renderLists(assignments, completed, certificates) {
    const assignmentList = $('assignments');
    const completedList = $('completed');
    const certificateList = $('certificates');
    assignmentList.replaceChildren(...(assignments.length ? assignments.map(item => courseItem(
      courseNames[item.course_id] || item.course_id,
      item.due_date ? `Due ${new Date(item.due_date + 'T00:00:00').toLocaleDateString()}` : 'No deadline'
    )) : [emptyItem('No assignments yet.')]));
    completedList.replaceChildren(...(completed.length ? completed.map(item => courseItem(
      courseNames[item.course_id] || item.course_id,
      `${item.score}% · ${new Date(item.completed_at).toLocaleDateString()}`
    )) : [emptyItem('No completed courses yet.')]));
    certificateList.replaceChildren(...(certificates.length ? certificates.map(item => courseItem(
      courseNames[item.course_id] || item.course_id,
      item.certificate_number,
      certificateKeys[item.course_id] ? `certificate.html?course=${certificateKeys[item.course_id]}` : undefined
    )) : [emptyItem('No certificates yet.')]));
    $('assignmentCount').textContent = assignments.length;
    $('completedCount').textContent = completed.length;
    $('certificateCount').textContent = certificates.length;
  }

  async function saveProfile(event) {
    event.preventDefault();
    const button = $('saveProfileButton');
    const status = $('profileStatus');
    button.disabled = true;
    status.textContent = 'Saving…';
    try {
      const profile = await api.saveMyProfile($('displayName').value);
      const user = await api.getCurrentUser();
      setIdentity(profile.display_name, user.email);
      status.textContent = 'Your display name has been saved.';
    } catch (error) {
      console.error('Could not save profile.', error);
      status.textContent = error.message || 'The display name could not be saved.';
    } finally {
      button.disabled = false;
    }
  }

  async function initialise() {
    const user = await api.getCurrentUser();
    if (!user) { window.location.href = 'auth.html'; return; }
    $('accountEmail').textContent = user.email;
    $('profileForm').addEventListener('submit', saveProfile);
    try {
      const [profile, assignments, completed, certificates] = await Promise.all([
        api.getMyProfile(), api.getMyAssignments(), api.getCompletedCourses(), api.getMyCertificates()
      ]);
      setIdentity(profile?.display_name, user.email);
      renderLists(assignments, completed, certificates);
    } catch (error) {
      console.error('Could not load account data.', error);
      setIdentity('', user.email);
      $('profileStatus').textContent = 'Some account data could not be loaded. Please try again.';
    }
  }

  initialise();
}());
