import { NextApiRequest, NextApiResponse } from 'next';
import { createToken, signatureMessage } from '@src/helpers/auth/Jwt';
//import { User } from '@server/models';
import MetrixMessage from 'bitcoinjs-message';

const handler: (_req: NextApiRequest, res: NextApiResponse) => Promise<void> =
  async (_req: NextApiRequest, res: NextApiResponse) => {
    const complete = (token: string) => {
      /* Send succes with token */
      return res.status(200).json({
        statusCode: 200,
        success: true,
        token
      });
    };

    try {
      if (_req.method !== 'POST') {
        return res.status(405).json({
          statusCode: 405,
          message: 'Invalid Request',
          required: 'POST'
        });
      }

      const resp = _req.body;
      const { message, address, signature } = resp;

      //console.log(`account ${address}`);
      //console.log(`message ${message}`);
      //console.log(`signature ${signature}`);

      /*let user: User | null = null;
      user = await User.findOne({ where: { address_mrx: address } });
      //console.log(`user ${JSON.stringify(user)}`);

      if (user === null) {
        return res.status(404).json({
          statusCode: 404,
          message: 'User lookup found nothing'
        });
      }
      user = user.get();*/

      // TODO: setup user...
      const user = { nonce: '', uuid: '' };

      const prefix = '\x15Metrix Signed Message:\n';
      const messageSrv = `${signatureMessage}${user.nonce}`;

      let verified = false;
      try {
        verified = MetrixMessage.verify(
          message,
          address,
          signature,
          prefix,
          false
        );
        //console.log(`verified ${verified}`);
      } catch (/* eslint-disable @typescript-eslint/no-explicit-any */ e: any) {
        console.log(e);
        return res.status(500).json({ statusCode: 412, message: e.message });
      }

      //console.log(`message ${JSON.stringify(message)}`);
      //console.log(`messageSrv ${JSON.stringify(messageSrv)}`);
      //console.log(`message === messageSrv ${message === messageSrv}`);

      if (verified && message === messageSrv) {
        const token_jwt: string = createToken(user.uuid, address, false, 'MRX');
        //console.log(`token_jwt ${token_jwt}`);

        /*await User.update(
          {
            isLogin: true,
            nonce: ''
          },
          { where: { address_mrx: address, chain: 'MRX' } }
        );*/

        return complete(token_jwt);
      } else {
        return res.status(404).json({
          statusCode: 404,
          message: 'User lookup failed validation.'
        });
      }
    } catch (/* eslint-disable @typescript-eslint/no-explicit-any */ err: any) {
      res.status(500).json({ statusCode: 500, message: err.message });
    }
  };

export default handler;
