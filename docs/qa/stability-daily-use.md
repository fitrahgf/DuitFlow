# Stability + Daily-Use QA

## Matrix

- Viewport: `390x844`, `768x1024`, `1440x900`
- Theme: `light`, `dark`
- Language: `id`, `en`
- Currency: `IDR`, `USD`, `SGD`

## Must-Check Flows

- register
- login
- logout
- settings save
- currency switch
- create transaction
- edit transaction
- create transfer
- edit transfer
- create wallet
- archive wallet
- notification filters
- transactions search
- transactions advanced filters
- transactions reset filters
- CSV export
- quick add
- no browser-native validation errors on formatted amount input

## Pass Log

Gunakan tabel ini saat smoke/manual QA:

| Date | Env | Viewport | Theme | Language | Currency | Flow | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |

## Focus Areas

- Separator ribuan mengikuti `currency_code`
- URL query params tetap sinkron setelah refresh dan browser back
- Transaction export hanya membawa hasil filter aktif
- Wallet create tidak gagal karena RLS
- Register/login tidak berujung dead-end message
