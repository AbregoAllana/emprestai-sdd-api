import { Controller, Get } from '@nestjs/common'
import contract = require('../docs/openapi.json')

@Controller()
export class OpenApiController {
  @Get('openapi.json')
  getContract() {
    return contract
  }
}
