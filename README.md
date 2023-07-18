# Identity-Reconciliation

### Project Goal

identify and keep track of a customer's identity across multiple purchases.
Typescript

{
	id                   Int                   
  phoneNumber          String?
  email                String?
  linkedId             Int? // the ID of another Contact linked to this one
  linkPrecedence       "secondary"|"primary" // "primary" if it's the first Contact in the link
  createdAt            DateTime              
  updatedAt            DateTime              
  deletedAt            DateTime?
}

### Install dependencies

`npm install`

### Run in development mode

`npm run dev`
