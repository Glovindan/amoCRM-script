import axios from "axios";

const CLIENT_ID = ""; // ID интеграции
const CLIENT_SECRET = ""; // Секретный ключ
const URL = ""; // URL аккаунта напр. https://name.amocrm.ru/
const AUTH_CODE = ""; // Код авторизации

const CONTACTS_LIMIT = 250; // Лимит контактов на страницу
const CONTACTS_PAGE = 1; // Номер страницы

//Получение токена из кода авторизации
const getTokenFromAuthCode = async (url, authCode) => {
  const data = {
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "grant_type": "authorization_code",
    "code": authCode,
    "redirect_uri": url
  }

  const apiPath = 'oauth2/access_token';

  return await axios.post(`${url}${apiPath}`, data);
}

//Получение списка контактов без сделок
const getContactsWithNoLead = async (url, accessToken) => {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      'limit': CONTACTS_LIMIT,
      'page': CONTACTS_PAGE,
      'with': 'leads'
    }
  }

  const apiPath = 'api/v4/contacts';

  const contactsAnswer = await axios.get(`${url}${apiPath}`, config);
  const contacts = contactsAnswer.data._embedded.contacts;

  return contacts.filter((contact) => {
    return contact._embedded.leads.length === 0;
  });
}

//Добавление задач
const addTasks = async (url, accessToken, contacts) => {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }

  const apiPath = 'api/v4/tasks';

  const data = contacts.map(contact => {
      return {
        entity_id: contact.id,
        entity_type: 'contacts',
        text: 'Контакт без сделок',
        complete_till: Date.now() + 86400000
      }
  })

  return await axios.post(`${url}${apiPath}`, data, config);
}

getTokenFromAuthCode(URL, AUTH_CODE)
  .then(async (res) => {
    const accessToken = res.data.access_token;
    const contacts = await getContactsWithNoLead(URL, accessToken);
    await addTasks(URL, accessToken, contacts);

    console.log('Задачи созданы')
  })
  .catch((err) => {
    console.log(err.response.data.detail);
  })