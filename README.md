<div id="top"></div>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
<h1 align="center">[BE] Travelbook</h1>

  <p align="center">
        Travelbook jest to serwis społecznościowy, dzięki któremu udokumentujemy nasze podróże.
    <br />
    <br />
    <a href="https://travelbook.networkmanager.info/">Demo</a><br>
    <a href="https://github.com/ezterr/travel-journal-frontend">frontend-repo</a>

<b>Username:</b> tester
<br>
<b>Password:</b> Test1234
  </p>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Spis treści</summary>
  <ol>
    <li>
      <a href="#o-projekcie">O projekcie</a>
      <ul>
        <li><a href="#technologie">Technologie</a></li>
      </ul>
    </li>
    <li>
      <a href="#jak-zacząć">Jak zacząć</a>
      <ul>
        <li><a href="#warunki-wstepne">Warunki wstępne</a></li>
        <li><a href="#instalacja">Instalacja</a></li>
      </ul>
    </li>
    <li>
      <a href="#endpoints">Endpoints</a>
      <ul>
        <li><a href="#auth">Autoryzacja</a></li>
        <li><a href="#user">Użytkownik</a></li>
        <li><a href="#travel">Podróż</a></li>
        <li><a href="#post">Post</a></li>
        <li><a href="#friendship">Przyjaciele</a></li>
      </ul>
    </li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## O projekcie

![Product Name Screen Shot][product-screenshot]

Aplikacja pozwala na stworzenie własnego dziennika podróży i podzielenia się nim ze znajomymi. Posty znajomych są wyświetlane na stronie głównej, z możliwością zobaczenia przebiegu całej podróży.

<p align="right">(<a href="#top">back to top</a>)</p>



### Technologie
[![Nest][Nest]][Nest-url]
[![Typescript][Typescript]][Typescript-url]
[![Typeorm][Typeorm]][Typeorm-url]
[![Jwt][Jwt]][Jwt-url]
[![Mysql][Mysql]][Mysql-url]
[![Passport][Passport]][Passport-url]
[![Bcrypt][Bcrypt]][Bcrypt-url]
[![Multer][Multer]][Multer-url]
[![Sharp][Sharp]][Sharp-url]
[![Imagesize][Imagesize]][Imagesize-url]
[![Jest][Jest]][Jest-url]
[![Eslint][Eslint]][Eslint-url]
[![Prettier][Prettier]][Prettier-url]

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Jak zacząć

### Warunki wstępne
* node
  ```sh
  node@^16.15.1
  ```
* yarn
  ```sh
  yarn@^1.22.19
  ```

### Instalacja

1. Sklonuj repozytorium
   ```sh
   git clone https://github.com/ezterr/travel-journal-backend.git
   ```
2. Przejdź do katalogu projektu
   ```sh
   cd travel-journal-backend
   ```
3. Zainstaluj wszystkie zależności
   ```sh
   yarn
   ```
4. zmień nazwę pliku `src/config/config.example.ts` na `src/config/config.ts`
   1. odpowiednio uzupełnij plik config `src/config/config.ts`
       ```ts
        export const config = {
          itemsCountPerPage: 10,  // maksymalna ilość elementów na jedną stronę
          jwtSecret: '',  // klucz zabezpieczający jwt
          jwtTimeToExpire: '1y',  // ważność jwt
          jwtCookieTimeToExpire: 1000 * 60 * 60 * 24 * 365, // ważność ciastaka
          jwtCookieDomain: 'localhost',  // Dozwolona domena, która może uzyskać dostęp do ciastka
          dbHost: 'localhost',  // Adres ip do bazy danych
          dbPort: 3306,  // Port do bazy danych
          dbDatabase: 'travel_journal',  // nazwa bazy danych
          dbUsername: 'root',  // nazwa użytkownika do bazy danych
          dbPassword: '',  // hasło do bazy danych
          dbSynchronize: true,  // czy typeorm ma synchronizować bazę danych zalecane - false
          dbLogging: false,  // wyświetlanie w konsoli wykonywanego sql
        };
       ```

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Endpoints

### Auth
* **POST /api/auth/login** - loguje użytkownika i ustawia mu ciastko z tokenem dostępu
  ```ts
    // dto dla body
    {
      username: string;
      password: string;
    }
  ```
* **DELETE /api/auth/logout** - wylogowanie użytkownika, usuwa jwt z ciastek
* **DELETE /api/auth/logout-all** - wylogowanie użytkownika ze wszystkich urządzeń, usuwa jwt z ciastek

* **GET /api/auth/user** - pobiera aktualnie zalogowanego użytkownika
<p align="right">(<a href="#top">back to top</a>)</p>

### User
* **GET /api/user/:id** - pobiera użytkownika po jego id
* **POST /api/user** - dodaje nowego użytkownika
    ```ts
      // dto dla body
      {
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        password: string;
        photo?: (Zdjęcie);
      }
    ```
* **GET /api/user/:id/index** - pobiera stronę główną danego użytkownika
* **GET /api/user/:id/friend/search** - wyszukuję znajomych dla danego użytkownika
    ```ts
      // dto dla query
      {
        page?: number;
        search?: string;
      }
    ```
* **DELETE /api/user/:id** - usuwa danego użytkownika
* **PATCH /api/user/:id** - aktualizuje danego użytkownika
    ```ts
      // dto dla body
      {
        firstName?: string;
        lastName?: string;
        username?: string;
        bio?: string;
        password?: string;
        newPassword?: string;
        photo?: (Zdjęcie);
      }
    ```
* **GET /api/user/:id/stats** - pobiera statystyki użytkownika
* **GET /api/user/photo/:id** - pobiera zdjęcie profilowe użytkownika
* **GET /api/user/:id/travel** - pobiera wszystkie podróże danego użytkownika
* **POST /api/user/:id/travel** - dodaje nową podróż do konta danego użytkownika
    ```ts
      // dto dla body
      {
        title: string;
        description: string;
        destination: string;
        comradesCount: number;
        startAt: string(Date);
        endAt: string(Date);
        photo?: (Zdjęcie);
      }
    ```
* **GET /api/user/:id/friend** - pobiera wszystkich znajomych
    ```ts
      // dto dla query
      {
        page?: number;
        status?: FriendshipStatus[];
      }
  
      enum FriendshipStatus {
        Accepted = 'accepted',
        Waiting = 'waiting',
        Invitation = 'invitation',
      } 
    ```
* **POST /api/user/:id/friendship** - zaprasza znajomego
    ```ts
      // dto dla body
      {
        friendId: string
      }
    ```
  <p align="right">(<a href="#top">back to top</a>)</p>

### Travel

* **GET /api/travel/:id** - Pobiera konkretną podróż
* **PATCH /api/travel/:id** - Aktualizuje podróż
    ```ts
      // dto dla body
      {
        title?: string;
        description?: string;
        destination?: string;
        comradesCount?: number;
        startAt?: string(Date);
        endAt?: string(Date);
        photo?: (Zdjęcie);
      }
    ```
* **DELETE /api/travel/:id** - Usuwa daną podróż
* **GET /api/travel/photo/:id** - Pobiera zdjęcie danej podróży
* **GET /api/travel/:id/post** - Pobiera wszystkie posty dla danej podróży 
* **POST /api/travel/:id/post** - Dodaje nowy post do danej podróży
    ```ts
      // dto dla body
      {
        title: string;
        destination: string;
        description: string;
        photo?: (Zdjęcie);
      }
    ```

<p align="right">(<a href="#top">back to top</a>)</p>

### Post

* **GET /api/post/:id** - Pobiera dany post
* **PATCH /api/post/:id** - Aktualizuje dany post
    ```ts
      // dto dla body
      {
        title?: string;
        destination?: string;
        description?: string;
        photo?: (Zdjęcie);
      }
    ```
* **DELETE /api/post/:id** - Usuwa dany post
* **GET /api/post/photo/:id** - Pobiera zdjęcie danego postu

<p align="right">(<a href="#top">back to top</a>)</p>

### Friendship

* **PATCH /api/friendship/:id** - Akceptuje daną znajomość
* **DELETE /api/friendship/:id** - Usuwa daną znajomość

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/ezterr/travel-journal-backend.svg?style=for-the-badge
[contributors-url]: https://github.com/ezterr/travel-journal-backend/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/ezterr/travel-journal-backend.svg?style=for-the-badge
[forks-url]: https://github.com/ezterr/travel-journal-backend/network/members
[stars-shield]: https://img.shields.io/github/stars/ezterr/travel-journal-backend.svg?style=for-the-badge
[stars-url]: https://github.com/ezterr/travel-journal-backend/stargazers
[issues-shield]: https://img.shields.io/github/issues/ezterr/travel-journal-backend.svg?style=for-the-badge
[issues-url]: https://github.com/ezterr/travel-journal-backend/issues

[Typescript]: https://img.shields.io/badge/typescript-20232A?style=for-the-badge&logo=typescript&logoColor=3178c6
[Typescript-url]: https://www.typescriptlang.org/
[Nest]: https://img.shields.io/badge/Nest-20232A?style=for-the-badge&logo=nestjs&logoColor=ea2845
[Nest-url]: https://nestjs.com/
[Typeorm]: https://img.shields.io/badge/type%20orm-20232A?style=for-the-badge&logo=typeorm&logoColor=ea2845
[Typeorm-url]: https://typeorm.io/
[Jwt]: https://img.shields.io/badge/jwt-20232A?style=for-the-badge&logo=JSONwebtokens&logoColor=fff
[Jwt-url]: https://jwt.io/
[Mysql]: https://img.shields.io/badge/mysql-20232A?style=for-the-badge&logo=mysql&logoColor=fff
[Mysql-url]: https://www.mysql.com/
[Passport]: https://img.shields.io/badge/passport-20232A?style=for-the-badge&logo=passport&logoColor=fff
[Passport-url]: https://www.passportjs.org/
[Multer]: https://img.shields.io/badge/multer-20232A?style=for-the-badge&logo=multer&logoColor=563d7c
[Multer-url]: https://www.npmjs.com/package/multer
[Bcrypt]: https://img.shields.io/badge/bcrypt-20232A?style=for-the-badge&logo=bcrypt&logoColor=fff
[Bcrypt-url]: https://github.com/kelektiv/node.bcrypt.js
[Jest]: https://img.shields.io/badge/jest-20232A?style=for-the-badge&logo=jest&logoColor=C63D14
[Jest-url]: https://www.npmjs.com/package/jest
[Sharp]: https://img.shields.io/badge/sharp-20232A?style=for-the-badge&logo=sharp&logoColor=98FF34
[Sharp-url]: https://sharp.pixelplumbing.com/
[Eslint]: https://img.shields.io/badge/eslint-20232A?style=for-the-badge&logo=eslint&logoColor=3a33d1
[Eslint-url]: https://www.npmjs.com/package/eslint
[Prettier]: https://img.shields.io/badge/prettier-20232A?style=for-the-badge&logo=prettier&logoColor=c596c7
[Prettier-url]: https://prettier.io/
[Imagesize]: https://img.shields.io/badge/image_size-20232A?style=for-the-badge&logo=uuid&logoColor=c596c7
[Imagesize-url]: https://www.npmjs.com/package/image-size

[product-screenshot]: readme/app.png
