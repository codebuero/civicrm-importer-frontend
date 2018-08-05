import CrmApi from 'civicrm'

const config = {
  server:'http://example.org',
  path:'/sites/all/modules/civicrm/extern/rest.php',
  key:'your key from settings.civicrm.php',
  api_key:'the user key'
};

const crmAPI = CrmApi(config);

export crmAPI